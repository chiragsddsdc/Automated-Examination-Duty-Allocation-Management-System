<?php
/**
 * ============================================================
 * EXCEL IMPORT API — Exam Schedules Bulk Import
 * ============================================================
 *
 * Accepts an uploaded .xlsx file, reads each data row, validates
 * all required fields, and bulk-inserts exam schedules into the
 * exam_schedules table.
 *
 * EXPECTED EXCEL COLUMNS (row 1 = header, data starts row 2):
 *   A → subject_name    (string,  required)
 *   B → subject_code    (string,  optional — auto-generated if blank)
 *   C → department      (string,  required)
 *   D → exam_date       (YYYY-MM-DD or Excel date serial, required)
 *   E → start_time      (HH:MM or HH:MM:SS, required)
 *   F → end_time        (HH:MM or HH:MM:SS, required)
 *   G → venue           (string,  required)
 *   H → total_students  (integer, optional — defaults to 0)
 *   I → duties_required (integer, optional — defaults to 2)
 *
 * ENDPOINT:
 *   POST /import.php   multipart/form-data, field name: "excel_file"
 *
 * RESPONSE:
 *   { imported, skipped, errors[], total_rows }
 *
 * @author  Chirag Yadav
 * @project Automated Examination Duty Allocation System
 * ============================================================
 */

require_once '../config/cors.php';
require_once '../config/db.php';
require_once '../config/validation.php';
require_once '../vendor/autoload.php';

use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Shared\Date as ExcelDate;

// Admin only — only admin can bulk-import schedules
$user = requireAdmin();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respondError('Method not allowed', 405);
}

// ── FILE VALIDATION ───────────────────────────────────────────
if (empty($_FILES['excel_file'])) {
    respondError('No file uploaded. Send field name: excel_file');
}

$file     = $_FILES['excel_file'];
$tmpPath  = $file['tmp_name'];
$origName = $file['name'];

if ($file['error'] !== UPLOAD_ERR_OK) {
    respondError('File upload error code: ' . $file['error']);
}

// Validate MIME type and extension
$ext = strtolower(pathinfo($origName, PATHINFO_EXTENSION));
if (!in_array($ext, ['xlsx', 'xls'])) {
    respondError('Only .xlsx and .xls files are accepted');
}

$allowedMimes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'application/octet-stream',
];
$finfo = finfo_open(FILEINFO_MIME_TYPE);
$mime  = finfo_file($finfo, $tmpPath);
finfo_close($finfo);
if (!in_array($mime, $allowedMimes)) {
    respondError("Invalid file type detected: $mime");
}

// Max file size: 5 MB
if ($file['size'] > 5 * 1024 * 1024) {
    respondError('File too large. Maximum size is 5 MB');
}

// ── READ SPREADSHEET ──────────────────────────────────────────
try {
    $spreadsheet = IOFactory::load($tmpPath);
} catch (\Exception $e) {
    respondError('Could not read file: ' . $e->getMessage());
}

$sheet    = $spreadsheet->getActiveSheet();
$highRow  = $sheet->getHighestRow();          // Last row with data
$highCol  = $sheet->getHighestColumn();       // Last column letter

if ($highRow < 2) {
    respondError('File is empty or has only a header row. Add data from row 2.');
}

// Use the shared constant from validation.php (single source of truth)
$validDepartments = VALID_DEPARTMENTS;

// ── PROCESS ROWS ──────────────────────────────────────────────
$db = getDB();

// Prepare insert statement once and reuse for each valid row
$stmt = $db->prepare(
    'INSERT INTO exam_schedules
        (subject_name, subject_code, department, exam_date, start_time, end_time, venue, total_students, duties_required)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
);

$imported  = 0;   // Successfully inserted rows
$skipped   = 0;   // Rows skipped due to validation errors
$rowErrors = [];  // Detailed error messages per row

// Start from row 2 (row 1 is assumed to be the header)
for ($row = 2; $row <= $highRow; $row++) {

    // ── READ & SANITIZE CELL VALUES ───────────────────────────
    // sanitizeStr() trims + strips HTML entities; safe for DB storage
    // Raw numeric cells (dates, times, integers) are kept as-is for parsing
    $subjectName    = sanitizeStr((string) $sheet->getCell("A{$row}")->getValue(), 150);
    $subjectCode    = sanitizeStr((string) $sheet->getCell("B{$row}")->getValue(), 30);
    $department     = sanitizeStr((string) $sheet->getCell("C{$row}")->getValue(), 100);
    $examDateRaw    = $sheet->getCell("D{$row}")->getValue();  // may be numeric serial or string
    $startTimeRaw   = $sheet->getCell("E{$row}")->getValue();  // may be numeric fraction or string
    $endTimeRaw     = $sheet->getCell("F{$row}")->getValue();
    $venue          = sanitizeStr((string) $sheet->getCell("G{$row}")->getValue(), 100);
    $totalStudents  = $sheet->getCell("H{$row}")->getValue();
    $dutiesRequired = $sheet->getCell("I{$row}")->getValue();

    // Skip completely blank rows silently
    if ($subjectName === '' && $department === '' && $venue === '') {
        continue;
    }

    $rowLabel = "Row {$row}";
    $errors   = [];

    // ── VALIDATE REQUIRED FIELDS ──────────────────────────────
    if ($subjectName === '') {
        $errors[] = 'subject_name is required';
    }
    if ($department === '') {
        $errors[] = 'department is required';
    } elseif (!in_array($department, $validDepartments)) {
        $errors[] = "Invalid department '$department'. Must be one of: " . implode(', ', $validDepartments);
    }
    if ($venue === '') {
        $errors[] = 'venue is required';
    }

    // ── PARSE EXAM DATE ───────────────────────────────────────
    // Excel stores dates as numeric serial numbers (e.g. 45000)
    // Strings like "2025-04-15" are also accepted
    $examDate = '';
    if (is_numeric($examDateRaw) && $examDateRaw > 1) {
        // Convert Excel serial date → PHP timestamp → MySQL date
        $ts       = ExcelDate::excelToTimestamp($examDateRaw);
        $examDate = date('Y-m-d', $ts);
    } elseif (is_string($examDateRaw) && $examDateRaw !== '') {
        // Try to parse string date in various formats
        $ts = strtotime($examDateRaw);
        if ($ts !== false) {
            $examDate = date('Y-m-d', $ts);
        } else {
            $errors[] = "Invalid exam_date '$examDateRaw'. Use YYYY-MM-DD format.";
        }
    } else {
        $errors[] = 'exam_date is required';
    }

    // Reject past dates
    if ($examDate && $examDate < date('Y-m-d')) {
        $errors[] = "exam_date '$examDate' is in the past";
    }

    // ── PARSE START TIME ──────────────────────────────────────
    // Excel time serials are fractions of a day (0.375 = 09:00)
    // Strings like "09:00" or "09:00:00" are also accepted
    $startTime = '';
    if (is_numeric($startTimeRaw) && $startTimeRaw >= 0 && $startTimeRaw < 1) {
        $startTime = date('H:i:s', ExcelDate::excelToTimestamp($startTimeRaw));
    } elseif (is_string($startTimeRaw) && $startTimeRaw !== '') {
        // Normalise "9:30" → "09:30:00"
        $ts = strtotime($startTimeRaw);
        $startTime = $ts !== false ? date('H:i:s', $ts) : '';
        if ($startTime === '') $errors[] = "Invalid start_time '$startTimeRaw'";
    } else {
        $errors[] = 'start_time is required';
    }

    // ── PARSE END TIME ────────────────────────────────────────
    $endTime = '';
    if (is_numeric($endTimeRaw) && $endTimeRaw >= 0 && $endTimeRaw < 1) {
        $endTime = date('H:i:s', ExcelDate::excelToTimestamp($endTimeRaw));
    } elseif (is_string($endTimeRaw) && $endTimeRaw !== '') {
        $ts = strtotime($endTimeRaw);
        $endTime = $ts !== false ? date('H:i:s', $ts) : '';
        if ($endTime === '') $errors[] = "Invalid end_time '$endTimeRaw'";
    } else {
        $errors[] = 'end_time is required';
    }

    // Validate end time is after start time
    if ($startTime && $endTime && $endTime <= $startTime) {
        $errors[] = 'end_time must be after start_time';
    }

    // ── OPTIONAL FIELDS WITH DEFAULTS ─────────────────────────
    // subject_code: auto-generate from subject name initials if blank
    if ($subjectCode === '') {
        $words = explode(' ', strtoupper($subjectName));
        $subjectCode = implode('', array_map(fn($w) => $w[0] ?? '', $words))
                     . rand(100, 999);
    }

    $totalStudents  = is_numeric($totalStudents)  ? max(0, intval($totalStudents))  : 0;
    $dutiesRequired = is_numeric($dutiesRequired) ? max(1, intval($dutiesRequired)) : 2;

    // ── IF VALIDATION FAILED, RECORD ERROR AND SKIP ───────────
    if (!empty($errors)) {
        $rowErrors[] = "$rowLabel (" . ($subjectName ?: 'unnamed') . "): " . implode('; ', $errors);
        $skipped++;
        continue;
    }

    // ── INSERT ROW INTO DATABASE ──────────────────────────────
    try {
        $stmt->bind_param(
            'sssssssii',
            $subjectName, $subjectCode, $department,
            $examDate, $startTime, $endTime,
            $venue, $totalStudents, $dutiesRequired
        );
        $stmt->execute();
        $imported++;
    } catch (\Exception $e) {
        $rowErrors[] = "$rowLabel ($subjectName): Database error — " . $e->getMessage();
        $skipped++;
    }
}

// ── RESPONSE ──────────────────────────────────────────────────
$totalProcessed = $imported + $skipped;

respond([
    'message'     => "Import complete. $imported row(s) imported, $skipped skipped.",
    'imported'    => $imported,
    'skipped'     => $skipped,
    'total_rows'  => $totalProcessed,
    'errors'      => $rowErrors,
]);
