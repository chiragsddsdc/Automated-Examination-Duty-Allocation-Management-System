<?php
/**
 * ============================================================
 * EMAIL CONFIGURATION - PHPMailer with Gmail SMTP
 * ============================================================
 *
 * Provides a reusable function to send HTML emails via Gmail.
 * Used when duty is assigned to notify faculty members.
 *
 * SMTP Settings: Gmail with App Password (2FA must be enabled)
 * App Password: Generated from Google Account → Security → App Passwords
 *
 * @author  Chirag Yadav
 * @project Automated Examination Duty Allocation System
 * ============================================================
 */

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use PHPMailer\PHPMailer\Exception;

require_once __DIR__ . '/../vendor/autoload.php';

// ── SMTP CREDENTIALS ──────────────────────────────────────────
define('MAIL_HOST',       'smtp.gmail.com');
define('MAIL_PORT',       587);
define('MAIL_USERNAME',   'chiragyadav2424@gmail.com');
define('MAIL_PASSWORD',   'ylky inlv gocf hfnl');
define('MAIL_FROM_NAME',  'Exam Duty System');
define('MAIL_ENCRYPTION', PHPMailer::ENCRYPTION_STARTTLS);

/**
 * Send a duty assignment email to a faculty member.
 *
 * @param  string $toEmail      Faculty's email address
 * @param  string $toName       Faculty's full name
 * @param  string $subjectName  Exam subject name
 * @param  string $examDate     Exam date (Y-m-d format)
 * @param  string $startTime    Exam start time (H:i:s format)
 * @param  string $endTime      Exam end time (H:i:s format)
 * @param  string $venue        Exam venue/room
 * @param  string $dutyType     Type of duty (Invigilation, Supervision, etc.)
 * @return bool                 True on success, false on failure
 */
function sendDutyAssignmentEmail($toEmail, $toName, $subjectName, $examDate, $startTime, $endTime, $venue, $dutyType) {

    $mail = new PHPMailer(true); // true = enable exceptions

    try {
        // ── SERVER SETTINGS ───────────────────────────────────
        $mail->isSMTP();
        $mail->Host       = MAIL_HOST;
        $mail->SMTPAuth   = true;
        $mail->Username   = MAIL_USERNAME;
        $mail->Password   = MAIL_PASSWORD;
        $mail->SMTPSecure = MAIL_ENCRYPTION;
        $mail->Port       = MAIL_PORT;

        // ── SENDER & RECIPIENT ────────────────────────────────
        $mail->setFrom(MAIL_USERNAME, MAIL_FROM_NAME);
        $mail->addAddress($toEmail, $toName);

        // ── FORMAT DATE & TIME FOR DISPLAY ────────────────────
        $formattedDate  = date('l, d F Y', strtotime($examDate));   // e.g. Monday, 15 April 2025
        $formattedStart = date('h:i A', strtotime($startTime));      // e.g. 09:30 AM
        $formattedEnd   = date('h:i A', strtotime($endTime));        // e.g. 12:30 PM

        // ── EMAIL CONTENT ─────────────────────────────────────
        $mail->isHTML(true);
        $mail->Subject = "Exam Duty Assigned: {$subjectName}";
        $mail->Body    = "
<!DOCTYPE html>
<html lang='en'>
<head>
  <meta charset='UTF-8'>
  <meta name='viewport' content='width=device-width, initial-scale=1.0'>
  <title>Duty Assignment</title>
</head>
<body style='margin:0; padding:0; background-color:#f0f4f8; font-family: Arial, sans-serif;'>

  <table width='100%' cellpadding='0' cellspacing='0' style='background-color:#f0f4f8; padding: 30px 0;'>
    <tr>
      <td align='center'>

        <!-- Card Container -->
        <table width='600' cellpadding='0' cellspacing='0' style='background-color:#ffffff; border-radius:10px; overflow:hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);'>

          <!-- Header -->
          <tr>
            <td style='background: linear-gradient(135deg, #1e3a5f 0%, #2d6a9f 100%); padding: 30px 40px; text-align: center;'>
              <h1 style='color:#ffffff; margin:0; font-size:22px; letter-spacing:1px;'>📋 EXAM DUTY SYSTEM</h1>
              <p style='color:#a8d8f0; margin: 6px 0 0 0; font-size:13px;'>Automated Examination Duty Allocation</p>
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style='padding: 30px 40px 10px 40px;'>
              <h2 style='color:#1e3a5f; margin:0 0 8px 0; font-size:20px;'>Hello, {$toName}!</h2>
              <p style='color:#555; margin:0; font-size:15px; line-height:1.6;'>
                You have been assigned a new exam duty. Please review the details below and report on time.
              </p>
            </td>
          </tr>

          <!-- Duty Badge -->
          <tr>
            <td style='padding: 16px 40px;'>
              <div style='display:inline-block; background-color:#e8f4fd; border-left: 4px solid #2d6a9f; padding: 10px 20px; border-radius: 4px;'>
                <span style='color:#2d6a9f; font-weight:bold; font-size:15px;'>Duty Type: {$dutyType}</span>
              </div>
            </td>
          </tr>

          <!-- Details Table -->
          <tr>
            <td style='padding: 10px 40px 30px 40px;'>
              <table width='100%' cellpadding='0' cellspacing='0' style='border-collapse: collapse; border-radius:8px; overflow:hidden; border: 1px solid #dde6ef;'>

                <tr style='background-color:#f7fafd;'>
                  <td style='padding:14px 20px; font-size:13px; color:#888; font-weight:bold; text-transform:uppercase; width:35%; border-bottom:1px solid #dde6ef;'>Subject</td>
                  <td style='padding:14px 20px; font-size:15px; color:#222; font-weight:600; border-bottom:1px solid #dde6ef;'>{$subjectName}</td>
                </tr>

                <tr style='background-color:#ffffff;'>
                  <td style='padding:14px 20px; font-size:13px; color:#888; font-weight:bold; text-transform:uppercase; border-bottom:1px solid #dde6ef;'>Date</td>
                  <td style='padding:14px 20px; font-size:15px; color:#222; border-bottom:1px solid #dde6ef;'>{$formattedDate}</td>
                </tr>

                <tr style='background-color:#f7fafd;'>
                  <td style='padding:14px 20px; font-size:13px; color:#888; font-weight:bold; text-transform:uppercase; border-bottom:1px solid #dde6ef;'>Time</td>
                  <td style='padding:14px 20px; font-size:15px; color:#222; border-bottom:1px solid #dde6ef;'>{$formattedStart} &ndash; {$formattedEnd}</td>
                </tr>

                <tr style='background-color:#ffffff;'>
                  <td style='padding:14px 20px; font-size:13px; color:#888; font-weight:bold; text-transform:uppercase;'>Venue</td>
                  <td style='padding:14px 20px; font-size:15px; color:#222;'>{$venue}</td>
                </tr>

              </table>
            </td>
          </tr>

          <!-- Notice -->
          <tr>
            <td style='padding: 0 40px 30px 40px;'>
              <div style='background-color:#fff8e1; border: 1px solid #ffe082; border-radius:6px; padding: 14px 18px;'>
                <p style='margin:0; color:#795548; font-size:13px; line-height:1.6;'>
                  ⚠️ <strong>Important:</strong> Please report to the venue 10 minutes before the exam starts.
                  If you are unable to attend, contact the exam coordinator immediately.
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style='background-color:#f7fafd; padding: 20px 40px; text-align:center; border-top: 1px solid #dde6ef;'>
              <p style='margin:0; color:#aaa; font-size:12px;'>
                This is an automated email from the Exam Duty Allocation System.<br>
                Please do not reply to this email.
              </p>
            </td>
          </tr>

        </table>
        <!-- End Card -->

      </td>
    </tr>
  </table>

</body>
</html>";

        // Plain text fallback for email clients that don't support HTML
        $mail->AltBody = "Hello {$toName},\n\n"
            . "You have been assigned a new exam duty.\n\n"
            . "Duty Type : {$dutyType}\n"
            . "Subject   : {$subjectName}\n"
            . "Date      : {$formattedDate}\n"
            . "Time      : {$formattedStart} - {$formattedEnd}\n"
            . "Venue     : {$venue}\n\n"
            . "Please report 10 minutes before the exam starts.\n\n"
            . "— Exam Duty Allocation System";

        $mail->send();
        return true;

    } catch (Exception $e) {
        // Log the error but don't crash the allocation process
        error_log("Email send failed to {$toEmail}: " . $mail->ErrorInfo);
        return false;
    }
}
