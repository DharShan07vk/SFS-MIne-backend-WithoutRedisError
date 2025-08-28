import { eq } from "drizzle-orm";
import { readFileSync } from "fs";
import path from "path";
import { Color, PDFDocument, PDFFont, rgb, StandardFonts } from "pdf-lib";
import { db } from "../db/connection";
import { trainingEnrolmentTable } from "../db/schema";
import { PDFGenerationType } from "../redis";
import { supabase, SUPABASE_PROJECT_URL } from "../supabase";
import { slugify } from "./validation";
import fontkit from "@pdf-lib/fontkit";

export async function generateCertificate(data: PDFGenerationType) {
  try {
    // Load the sample PDF
    const pdfPath = path.join(__dirname, "../assets/sample.pdf");
    const existingPdfBytes = readFileSync(pdfPath);

    // Load PDF document and embed font
    const pdfDoc = await PDFDocument.load(existingPdfBytes);

    pdfDoc.registerFontkit(fontkit);
    const nameFontBytes = readFileSync(
      path.join(__dirname, "../assets/GoodVibrations Script.ttf"),
    );
    const nameFont = await pdfDoc.embedFont(nameFontBytes);

    const fontBytes = readFileSync(
      path.join(__dirname, "../assets/Madera Regular.otf"),
    );
    const font = await pdfDoc.embedFont(fontBytes);

    const boldFontBytes = readFileSync(
      path.join(__dirname, "../assets/Madera W01 Bold.otf"),
    );
    const boldFont = await pdfDoc.embedFont(boldFontBytes);

    const pages = pdfDoc.getPages();
    const firstPage = pages[0];

    // Add name to the PDF
    let textWidth = nameFont.widthOfTextAtSize(data.name, 40);
    firstPage.drawText(data.name, {
      x: (600 - textWidth) / 2,
      y: 350,
      size: 40,
      font: nameFont,
      color: rgb(0, 0, 0),
    });

    //course name - Bro template text like "completed ...." adhu ku thaniya string vatchi merge panniralam
    let duration = "one week";
    let instructor = data.instructor;
    let content = `Completed a structured ${data.courseName} online course through the collaborative 'STEM for Society' program, delivered by ${instructor}.`;

    const fontSize = 12;
    const y = 300;
    const xStart = 75;

    function drawStyledText(
      x: number,
      y: number,
      styles: { font: PDFFont; size?: number; color?: Color; text: string }[],
    ) {
      let currentX = x;
      let currentY = y;
      let mid = 2;
      const lineHeight = 1.5 * fontSize;
      for (const style of styles) {
        firstPage.drawText(style.text, {
          x: currentX,
          y: currentY,
          font: style.font,
          size: style.size || fontSize,
          color: style.color || rgb(0, 0, 0),
        });

        currentX += style.font.widthOfTextAtSize(
          style.text,
          style.size || fontSize,
        );
        if (currentX >= 500) {
          currentX = x;
          mid++;
          currentY -= lineHeight;
          console.log("yeet");
        }
      }
    }

    let wordObjects = [
      [
        { text: "Completed ", font: font },
        { text: "a ", font: font },
        { text: "structured ", font: font },
        { text: " ", font: font },
      ],
      [
        { text: " ", font: font },
        { text: "online ", font: font },
        { text: "course ", font: font },
        { text: "(duration: ", font: font },
        { text: " ", font: font },
      ],
      [
        { text: ") ", font: font },
        { text: "through ", font: font },
        { text: "the ", font: font },
        { text: "collaborative ", font: font },
        { text: "'STEM ", font: font },
        { text: "for ", font: font },
        { text: "Society' ", font: font },
        { text: "program ", font: font },
        { text: "delivered ", font: font },
        { text: "by ", font: font },
        { text: " ", font: font },
      ],
      [{ text: ".", font: font }],
    ];

    let keys = [
      data.courseName.split(" "),
      duration.split(" "),
      instructor.split(" "),
    ];

    let keyObjects = keys.map((innerArray) =>
      innerArray.map((key) => ({
        text: key + " ",
        font: boldFont,
      })),
    );
    console.log(wordObjects, keyObjects);
    drawStyledText(xStart, y, [
      ...wordObjects[0], //Completed a structured
      ...keyObjects[0],
      ...wordObjects[1], // online course (duration:
      ...keyObjects[1],
      ...wordObjects[2], // through the collaborative 'STEM for Society' program, delivered by
      ...keyObjects[2],
    ]);
    firstPage.drawText(data.certificateId, {
      x: 120,
      y: 170,
      size: 6,
      font,
      color: rgb(0, 0, 0),
    });

    const pdfBuffer = await pdfDoc.save();
    const pdfName = slugify(
      data.courseName + "-" + data.name + "-" + data.certificateId + "-",
    );
    const pdfFile = new File([pdfBuffer], pdfName, { type: "application/pdf" });

    const { data: pdfURL, error } = await supabase.storage
      .from("s4s-media")
      .upload(`certificates/${pdfName}.pdf`, pdfFile, {
        upsert: true,
        contentType: "application/pdf",
      });

    console.log("🚀 ~ generateCertificate ~ pdfURL:", pdfURL);
    if (error) {
      console.log("PDF upload error: ", error.message);
      return false;
    }
    await db
      .update(trainingEnrolmentTable)
      .set({
        certificateNo: data.certificateId,
        certificate:
          SUPABASE_PROJECT_URL + "/storage/v1/object/public/" + pdfURL.fullPath,
      })
      .where(eq(trainingEnrolmentTable.id, data.enrolmentId));
    return true;
  } catch (error) {
    console.error("Error generating certificate:", error);
    return false;
  }
}
