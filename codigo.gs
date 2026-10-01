const SPREADSHEET_ID = "1Hg87oq8Uyx0nTlNi6bdxPMC09GxhAgeH9NW1hlWB5Vk";

function getSheet() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  return ss.getSheets()[0];
}

function doGet(e) {
  if (e && e.parameter && e.parameter.action === 'getData') {
    var sheet = getSheet();
    var data = sheet.getDataRange().getValues();
    var registros = [];

    // Empezamos en i = 1 para saltar la cabecera (fila 1: Fecha, Lobo, Timestamp)
    for (var i = 1; i < data.length; i++) {
      var filaFecha = data[i][0];
      var lobo = data[i][1];
      var timestamp = data[i][2];
      
      // Evitar filas vacías
      if (!filaFecha || !lobo) continue;

      if (filaFecha instanceof Date) {
        filaFecha = Utilities.formatDate(filaFecha, Session.getScriptTimeZone(), "yyyy-MM-dd");
      } else if (typeof filaFecha === 'string') {
        if (filaFecha.indexOf('T') !== -1) {
          filaFecha = filaFecha.split('T')[0];
        }
      }

      registros.push({
        fecha: filaFecha,
        lobo: lobo,
        time: timestamp
      });
    }

    return ContentService.createTextOutput(JSON.stringify(registros))
      .setMimeType(ContentService.MimeType.JSON);
  }

  // Intentar cargar el archivo HTML sin importar la variante de nombre (Index, index o Index.html)
  var htmlOutput;
  try {
    htmlOutput = HtmlService.createHtmlOutputFromFile('Index');
  } catch (e1) {
    try {
      htmlOutput = HtmlService.createHtmlOutputFromFile('index');
    } catch (e2) {
      try {
        htmlOutput = HtmlService.createHtmlOutputFromFile('Index.html');
      } catch (e3) {
        return ContentService.createTextOutput(JSON.stringify({
          "status": "ok",
          "message": "API Alimenta Tu Lobo activa y funcionando correctamente."
        })).setMimeType(ContentService.MimeType.JSON);
      }
    }
  }

  return htmlOutput
    .setTitle('Alimenta Tu Lobo')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      throw new Error("No se recibieron datos de registro.");
    }
    
    var data = JSON.parse(e.postData.contents);
    var fecha = data.fecha;
    var lobo = data.lobo;
    var timestamp = data.timestamp;

    if (!fecha || !lobo) {
      throw new Error("Faltan campos obligatorios: fecha o lobo.");
    }

    var sheet = getSheet();
    
    // Si la hoja está totalmente vacía, aseguramos la cabecera
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(["Fecha", "Lobo", "Timestamp"]);
    }

    sheet.appendRow([fecha, lobo, timestamp]);

    return ContentService.createTextOutput(JSON.stringify({"status": "success", "message": "Registro exitoso"}))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({"status": "error", "message": error.message}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
