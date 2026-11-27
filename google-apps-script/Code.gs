const RSVP_SHEET_NAME = "RSVP";
const RSVP_HEADERS = [
  "Name",
  "Attendance",
  "Guests",
  "Message",
  "Publish wish",
  "Submitted at",
];

function getRsvpSheet() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheet =
    spreadsheet.getSheetByName(RSVP_SHEET_NAME) ||
    spreadsheet.insertSheet(RSVP_SHEET_NAME);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(RSVP_HEADERS);
    return sheet;
  }

  const currentHeaders = sheet
    .getRange(1, 1, 1, Math.max(sheet.getLastColumn(), RSVP_HEADERS.length))
    .getValues()[0]
    .map(String);
  for (const header of RSVP_HEADERS) {
    if (!currentHeaders.includes(header)) {
      sheet.getRange(1, sheet.getLastColumn() + 1).setValue(header);
      currentHeaders.push(header);
    }
  }
  return sheet;
}

function safeText(value) {
  const text = String(value || "").trim();
  return /^[=+\-@]/.test(text) ? "'" + text : text;
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const name = String(data.name || "").trim();
    const attendance = data.attendance;
    const guests = attendance === "yes" ? Number(data.guests) : 0;
    const message = String(data.message || "").trim();
    if (
      !name ||
      name.length > 120 ||
      !["yes", "no"].includes(attendance) ||
      !Number.isInteger(guests) ||
      guests < 0 ||
      guests > 4 ||
      message.length > 1000
    ) {
      throw new Error("Invalid RSVP data");
    }

    const sheet = getRsvpSheet();
    const row = new Array(sheet.getLastColumn()).fill("");
    const headers = sheet
      .getRange(1, 1, 1, sheet.getLastColumn())
      .getValues()[0]
      .map(String);
    const values = {
      Name: safeText(name),
      Attendance: attendance,
      Guests: guests,
      Message: safeText(message),
      "Publish wish": data.publishWish === true ? "yes" : "no",
      "Submitted at": safeText(data.submittedAt || new Date().toISOString()),
    };
    headers.forEach((header, index) => {
      if (Object.prototype.hasOwnProperty.call(values, header)) {
        row[index] = values[header];
      }
    });
    sheet.appendRow(row);

    return ContentService.createTextOutput(JSON.stringify({ ok: true })).setMimeType(
      ContentService.MimeType.JSON,
    );
  } catch (error) {
    console.error(error);
    return ContentService.createTextOutput(JSON.stringify({ ok: false })).setMimeType(
      ContentService.MimeType.JSON,
    );
  }
}

function doGet(e) {
  if (!e || !e.parameter || e.parameter.action !== "wishes") {
    return ContentService.createTextOutput(
      JSON.stringify({ error: "Unsupported action" }),
    ).setMimeType(ContentService.MimeType.JSON);
  }

  const sheet = getRsvpSheet();
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    return ContentService.createTextOutput(JSON.stringify({ wishes: [] })).setMimeType(
      ContentService.MimeType.JSON,
    );
  }

  const headers = sheet
    .getRange(1, 1, 1, sheet.getLastColumn())
    .getValues()[0]
    .map(String);
  const rows = sheet
    .getRange(2, 1, lastRow - 1, sheet.getLastColumn())
    .getValues();
  const wishes = rows
    .filter(
      (row) =>
        row[headers.indexOf("Publish wish")] === "yes" &&
        String(row[headers.indexOf("Message")] || "").trim(),
    )
    .slice(-30)
    .map((row) => ({
      name: String(row[headers.indexOf("Name")] || ""),
      message: String(row[headers.indexOf("Message")] || ""),
      submittedAt: String(row[headers.indexOf("Submitted at")] || ""),
    }));

  return ContentService.createTextOutput(JSON.stringify({ wishes })).setMimeType(
    ContentService.MimeType.JSON,
  );
}
