import * as PDFKit from 'pdfkit';
import { existsSync } from 'fs';
import { join } from 'path';
import { ResumeData, DEFAULT_RESUME_PDF_SETTINGS, filterSkillsForPdf, getCertificationText, type ResumePdfSettings } from '.';

const titleColor = "#4A4A4A"
const contentColor = "#2C3E50"
const defaultColor = "#000000"

export class ResumePDFTemplate5 {
  private data: ResumeData;
  private pageWidth = 612; // Letter width in points (8.5 * 72)
  private pageHeight = 792; // Letter height in points (11 * 72)
  private marginX = 0.75 * 72; // 0.4 inch in points (horizontal)
  private marginT = 0.75 * 72; // 0.8 inch in points (vertical top)
  private marginB = 0.75 * 72; // 0.4 inch in points (vertical bottom)
  private contentWidth: number;
  private fontName = 'Calibri';
  private fontBold = 'Calibri-Bold';
  private fontItalic = 'Calibri-Italic';
  private fontBoldItalic = 'Calibri-BoldItalic';
  private fontPath: string | null = null;
  private fontBoldPath: string | null = null;
  private fontItalicPath: string | null = null;
  private fontBoldItalicPath: string | null = null;
  private pdfSettings: ResumePdfSettings;

  constructor(
    data: ResumeData,
    pdfSettings: ResumePdfSettings = DEFAULT_RESUME_PDF_SETTINGS,
  ) {
    this.data = this._normalizeData(data);
    this.pdfSettings = pdfSettings;
    this.contentWidth = this.pageWidth - 2 * this.marginX;
    this._findFonts();
  }

  private _normalizeData(data: ResumeData): ResumeData {
    return {
      name: data.name || '',
      title: data.title || '',
      contact: data.contact || {},
      summary: data.summary || '',
      skills: data.skills,
      experience: data.experience || [],
      education: data.education || [],
      certifications: Array.isArray(data.certifications) ? data.certifications : [],
    };
  }

  private _findFonts() {
    // const fontsDir = join(process.cwd(), 'assets', 'fonts', 'cambria');
    const fontsDir = join(process.cwd(), 'assets', 'fonts', 'calibri');

    const regularVariants = [
      'calibri-regular.ttf',
    ];
    const boldVariants = [
      'calibri-bold.ttf',
    ];
    const italicVariants = [
      'calibri-italic.ttf',
    ];
    const boldItalicVariants = [
      'calibri-bold-italic.ttf',
    ];

    if (existsSync(fontsDir)) {
      for (const variant of regularVariants) {
        const fontPath = join(fontsDir, variant);
        if (existsSync(fontPath) && !fontPath.toLowerCase().endsWith('.ttc')) {
          this.fontPath = fontPath;
          this.fontName = 'Calibri';
          break;
        }
      }

      for (const variant of boldVariants) {
        const fontPath = join(fontsDir, variant);
        if (existsSync(fontPath) && !fontPath.toLowerCase().endsWith('.ttc')) {
          this.fontBoldPath = fontPath;
          this.fontBold = 'Calibri-Bold';
          break;
        }
      }

      for (const variant of italicVariants) {
        const fontPath = join(fontsDir, variant);
        if (existsSync(fontPath) && !fontPath.toLowerCase().endsWith('.ttc')) {
          this.fontItalicPath = fontPath;
          this.fontItalic = 'Calibri-Italic';
          break;
        }
      }

      for (const variant of boldItalicVariants) {
        const fontPath = join(fontsDir, variant);
        if (existsSync(fontPath) && !fontPath.toLowerCase().endsWith('.ttc')) {
          this.fontBoldItalicPath = fontPath;
          this.fontBoldItalic = 'Calibri-BoldItalic';
          break;
        }
      }

      if (this.fontBoldPath === null && this.fontPath) {
        this.fontBoldPath = this.fontPath;
      }
      if (this.fontItalicPath === null && this.fontPath) {
        this.fontItalicPath = this.fontPath;
      }
      if (this.fontBoldItalicPath === null && this.fontBoldPath) {
        this.fontBoldItalicPath = this.fontBoldPath;
      }
    }
  }

  private _registerFonts(doc: any) {
    if (this.fontPath && existsSync(this.fontPath)) {
      try {

        doc.registerFont(this.fontName, this.fontPath);
        if (this.fontBoldPath) {
          doc.registerFont(this.fontBold, this.fontBoldPath);
        }
        if (this.fontItalicPath) {
          doc.registerFont(this.fontItalic, this.fontItalicPath);
        }
        if (this.fontBoldItalicPath) {
          doc.registerFont(this.fontBoldItalic, this.fontBoldItalicPath);
        }
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : String(e);
        console.log(`Warning: Could not register fonts: ${errorMessage}`);
        this.fontName = 'Calibri';
        this.fontBold = 'Calibri-Bold';
        this.fontItalic = 'Calibri-Italic';
        this.fontBoldItalic = 'Calibri-BoldItalic';
      }
    }
  }

  private _addName(doc: any) {
    const name = this.data.name || '';

    doc
      .font(this.fontBold)
      .fontSize(22)
      // .fillColor('#2C3E50')
      .fillColor(defaultColor)
      .text(name, this.marginX, this.marginT, {
        width: this.contentWidth,
        align: 'left',
      });

    doc.moveDown(0.3);
  }

  private _addTitle(doc: any) {
    const title = this.data.title || '';

    if (title) {
      // doc.font(this.fontName).fontSize(16).fillColor('#4A4A4A').text(title, {
      doc.font(this.fontName).fontSize(16).fillColor(defaultColor).text(title, {
        width: this.contentWidth,
        align: 'left',
      });
    }

    doc.moveDown(0.1);
  }

  private _addContact(doc: any) {
    const contact = this.data.contact || {};
    const address = contact.address || '';
    const email = contact.email || '';
    const phone = contact.phone || '';
    const linkedin = contact.linkedin || '';

    // doc.fontSize(12).fillColor('#4A4A4A');
    doc.fontSize(12).fillColor(defaultColor);

    const startY = doc.y;
    // doc.font(this.fontName).fillColor('#4A4A4A');
    doc.font(this.fontName).fillColor(defaultColor);
    const addressAndPhone = `${address} | ${phone} | ${email}`;
    doc.text(addressAndPhone, this.marginX, startY, {
      align: 'left'
    });

    doc.moveDown(1);
  }

  private _addSectionHeader(doc: any, title: string) {
    // Check if there's enough space for the section header
    // Section header needs: title line with background + spacing
    const headerFontSize = 14;
    const headerHeight = headerFontSize * 1.5; // Title line with padding
    const paddingVertical = headerFontSize * 0.15; // Vertical padding for background
    const spacingAfter = headerFontSize * 0.5; // moveDown(0.5)

    // Estimate minimum space needed for content that follows company line
    // This should be enough for at least a section title (like "Key Qualifications & Responsibilities")
    const contentFontSize = 11;
    const sectionTitleHeight = contentFontSize * 1.2; // Section title line
    const sectionTitleSpacing = contentFontSize * 0.3; // moveDown(0.3)
    const minContentLineHeight = contentFontSize * 1.2; // At least one bullet point line
    const minContentSpace =
      sectionTitleHeight +
      sectionTitleSpacing +
      minContentLineHeight +
      contentFontSize * 0.3; // Section title + spacing + one line + spacing

    const totalSpaceNeeded = headerHeight + spacingAfter + minContentSpace;

    const currentY = doc.y;
    const spaceAvailable = this.pageHeight - this.marginB - currentY;

    if (spaceAvailable < totalSpaceNeeded) {
      // Not enough space, add a new page
      doc.addPage();
    }

    const startY = doc.y;
    const fontSize = headerFontSize;
    const titleText = title.toUpperCase();

    // Reset opacity for text
    doc.opacity(1);

    // Draw text aligned to the left on top of background
    doc
      .font(this.fontBold)
      .fontSize(fontSize)
      // .fillColor('#2C3E50')
      .fillColor(defaultColor)
      .text(
        titleText,
        // this.marginX + paddingVertical,
        this.marginX,
        startY + paddingVertical,
        {
          width: this.contentWidth,
          align: 'left',
        },
      );
    const lineY = doc.y + 3;
    doc
      .moveTo(this.marginX, lineY)
      .lineTo(this.marginX + this.contentWidth, lineY)
      // .strokeColor('#2C3E50')
      .strokeColor('defaultColor')
      .lineWidth(0.5)
      .stroke();

    doc.moveDown(0.5);
  }

  private _estimateTextHeight(
    doc: any,
    text: string,
    width: number,
    fontSize: number,
    lineHeight?: number,
  ): number {
    const effectiveLineHeight = lineHeight || fontSize * 1.2;

    // Save current font and font size
    const savedFont = doc._font ? doc._font.name : null;
    const savedFontSize = doc._fontSize || 12;

    // Temporarily set font size for measurement
    doc.fontSize(fontSize);

    try {
      // Try to use PDFKit's widthOfString to calculate wrapping
      const words = text.split(' ');
      let currentLine = '';
      let lines = 1;

      for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        let lineWidth: number;

        try {
          lineWidth = doc.widthOfString(testLine);
        } catch (e) {
          // Fallback: estimate based on average character width
          // Average character width is approximately 0.6 * fontSize for most fonts
          const avgCharWidth = fontSize * 0.6;
          lineWidth = testLine.length * avgCharWidth;
        }

        if (lineWidth > width) {
          if (currentLine) {
            lines++;
            currentLine = word;
          } else {
            // Single word is too long, estimate how many lines it needs
            let wordWidth: number;
            try {
              wordWidth = doc.widthOfString(word);
            } catch (e) {
              const avgCharWidth = fontSize * 0.6;
              wordWidth = word.length * avgCharWidth;
            }
            lines += Math.max(1, Math.ceil(wordWidth / width));
            currentLine = '';
          }
        } else {
          currentLine = testLine;
        }
      }

      // Restore font state
      if (savedFont) {
        doc.font(savedFont).fontSize(savedFontSize);
      } else {
        doc.fontSize(savedFontSize);
      }

      return lines * effectiveLineHeight;
    } catch (e) {
      // If all else fails, use a simple character-based estimation
      // Restore font state
      if (savedFont) {
        doc.font(savedFont).fontSize(savedFontSize);
      } else {
        doc.fontSize(savedFontSize);
      }

      // Estimate: average 80 characters per line for 11pt font at standard width
      const avgCharsPerLine = Math.floor(width / (fontSize * 0.6));
      const estimatedLines = Math.max(
        1,
        Math.ceil(text.length / avgCharsPerLine),
      );
      return estimatedLines * effectiveLineHeight;
    }
  }

  private _addSummary(doc: any) {
    this._addSectionHeader(doc, 'PROFESSIONAL SUMMARY');
    const summary = (this.data.summary || '').replace(/\n/g, ' ');

    // doc.font(this.fontName).fontSize(11).fillColor('#333333').text(summary, {
    doc.font(this.fontName).fontSize(11).fillColor(defaultColor).text(summary, {
      width: this.contentWidth,
      align: 'left',
      paragraphGap: 3,
      lineGap: 3
    });

    doc.moveDown(1);
  }

  private _addSkills(doc: any) {
    const skills = filterSkillsForPdf(
      this.data.skills || [],
      this.pdfSettings.skillCategories,
    );
    if (skills.length === 0) {
      return;
    }

    this._addSectionHeader(doc, 'TECHNICAL SKILLS');

    // doc.font(this.fontName).fontSize(11).fillColor('#333333');
    doc.font(this.fontName).fontSize(11).fillColor(defaultColor);

    for (const skill of skills) {
      const itemsText = skill.items.join(', ');
      const categoryText = `${skill.category}: `;
      const fullText = categoryText + itemsText;

      // Estimate height needed for this skill line
      const fontSize = 11;
      const estimatedHeight = this._estimateTextHeight(
        doc,
        fullText,
        this.contentWidth,
        fontSize,
      );
      const spacingAfter = fontSize * 0.3; // moveDown(0.3)
      const minSpaceNeeded = estimatedHeight + spacingAfter;

      const currentY = doc.y;
      const spaceAvailable = this.pageHeight - this.marginB - currentY;

      // Check if we need a page break before rendering the category
      if (spaceAvailable < minSpaceNeeded) {
        doc.addPage();
      }

      doc.font(this.fontBold).text(categoryText, this.marginX, doc.y, {
        width: this.contentWidth,
        align: 'left',
        continued: true,
        lineGap: 3
      });
      doc.font(this.fontName).text(itemsText);
      doc.moveDown(0.3);
    }

    doc.moveDown(1);
  }

  private _ensureSpaceForSubtitleSection(
    doc: any,
    items: string[],
    options: {
      heightEstimateWidth?: number;
    } = {},
  ) {
    if (items.length === 0) {
      return;
    }

    const titleFontSize = 11;
    const contentFontSize = 11;
    const titleHeight = titleFontSize * 1.2;
    const titleSpacing = titleFontSize * 0.3;
    const contentSpacing = contentFontSize * 0.3;
    const paragraphGap = 2;
    const heightEstimateWidth =
      options.heightEstimateWidth ?? this.contentWidth;

    let totalContentHeight = 0;
    doc.font(this.fontName).fontSize(contentFontSize);
    for (const item of items) {
      const itemText = String(item).replace(/\n/g, ' ');
      const bulletText = `• ${itemText}`;
      totalContentHeight +=
        this._estimateTextHeight(
          doc,
          bulletText,
          heightEstimateWidth,
          contentFontSize,
        ) + paragraphGap;
    }

    const titleBlockHeight = this.pdfSettings.showSubTitle
      ? titleHeight + titleSpacing
      : 0;
    const totalSpaceNeeded =
      titleBlockHeight + totalContentHeight + contentSpacing;

    const currentY = doc.y;
    const spaceAvailable = this.pageHeight - this.marginB - currentY;
    const minSpaceRequired = this.pdfSettings.showSubTitle
      ? titleHeight + titleSpacing + contentFontSize * 1.2
      : contentFontSize * 1.2;

    if (spaceAvailable < minSpaceRequired) {
      doc.addPage();
    } else if (spaceAvailable < totalSpaceNeeded) {
      if (spaceAvailable < minSpaceRequired * 2) {
        doc.addPage();
      }
    }
  }

  private _addSubTitle(doc: any, subtitle: string) {
    doc
      .font(this.fontBold)
      .fontSize(11)
      .fillColor(defaultColor)
      .text(subtitle, this.marginX, doc.y, {
        width: this.contentWidth,
        align: 'left',
      });
    doc.moveDown(0.3);
  }

  private _addBulletItems(
    doc: any,
    items: string[],
    options: {
      bulletX?: number;
      textWidth?: number;
      contentColor?: string;
      lineGap?: number;
    } = {},
  ) {
    if (items.length === 0) {
      return;
    }

    const contentFontSize = 11;
    const bulletX = options.bulletX ?? this.marginX + 18;
    const textWidth = options.textWidth ?? this.contentWidth;
    const contentColor = options.contentColor ?? '#333333';

    doc.font(this.fontName).fontSize(contentFontSize).fillColor(contentColor);

    for (const item of items) {
      const itemText = String(item).replace(/\n/g, ' ');
      const bulletText = `• ${itemText}`;
      const textOptions: {
        width: number;
        align: 'left';
        paragraphGap: number;
        lineGap?: number;
      } = {
        width: textWidth,
        align: 'left',
        paragraphGap: 2,
      };
      if (options.lineGap !== undefined) {
        textOptions.lineGap = options.lineGap;
      }
      doc.text(bulletText, bulletX, doc.y, textOptions);
    }
  }

  private _addCompanySkills(
    doc: any,
    skillsInCompany: string | string[] | undefined,
  ) {
    if (!skillsInCompany) {
      return;
    }

    const skillsText = Array.isArray(skillsInCompany)
      ? skillsInCompany.join(', ')
      : String(skillsInCompany);
    const bulletX = this.marginX;
    doc.font(this.fontBoldItalic).fontSize(11).fillColor(defaultColor);
    doc.text('Skills: ', bulletX, doc.y, {
      width: this.contentWidth,
      align: 'left',
      continued: true,
    });
    doc.font(this.fontItalic).fillColor(defaultColor).text(skillsText);
    doc.moveDown(0.3);
  }

  private _addExperience(doc: any) {
    this._addSectionHeader(doc, 'PROFESSIONAL EXPERIENCE');
    const experiences = this.data.experience || [];

    for (const exp of experiences) {
      // Calculate space needed for this experience entry
      // const titleFontSize = 12;
      const titleFontSize = 12.5;
      const companyFontSize = 11.5;
      const titleHeight = titleFontSize * 1.2;
      const companyHeight = companyFontSize * 1.2;
      const companyLineHeight = companyFontSize * 1.2; // Line height for company font
      const spacingAfterCompany = companyLineHeight * 0.5; // moveDown(0.5) uses line height
      const minContentSpace = companyFontSize * 2.5; // At least 2 lines of content

      // Minimum space needed: title + company + spacing + at least some content
      const minSpaceNeeded =
        titleHeight + companyHeight + spacingAfterCompany + minContentSpace;

      const currentY = doc.y;
      const spaceAvailable = this.pageHeight - this.marginB - currentY;

      // Check if we need a page break before rendering the job title
      if (spaceAvailable < minSpaceNeeded) {
        doc.addPage();
      }

      // Render job title
      doc
        .font(this.fontBold)
        .fontSize(titleFontSize)
        // .fillColor('#2C3E50')
        .fillColor(defaultColor)
        .text(exp.title || '', this.marginX, doc.y, {
          width: this.contentWidth,
          align: 'left',
          continued: true,
          lineGap: 3
        });

      const company = exp.company || '';
      const dateRange = exp.date_range || '';
      // const location = exp.location || '';
      const location = exp.job_type || '';
      const companyText = company.trim();
      const dateLocation = location
        ? `${location} | ${dateRange}`.trim()
        : dateRange.trim();

      const col1Width = this.contentWidth * 0.5;
      const col2Width = this.contentWidth * 0.5;
      // Get current Y position
      let lineY = doc.y;
      const lineHeight = doc.currentLineHeight(true) || 13;

      // Check if we need a page break - ensure company and date stay together with content
      // Calculate if there's enough space on current page
      const spaceNeededForCompany =
        companyHeight + spacingAfterCompany + minContentSpace;
      const spaceAvailableForCompany = this.pageHeight - this.marginB - lineY;

      if (spaceAvailableForCompany < spaceNeededForCompany) {
        // Not enough space - add a new page
        doc.addPage();
        lineY = this.marginT; // Start at top margin of new page
      }

      doc
        .font(this.fontName)
        .fontSize(companyFontSize)
        // .fillColor('#2C3E50')
        .fillColor(defaultColor)
        .text(` | ${company}`);
    
      doc
        .fontSize(companyFontSize)
        .text(dateLocation, this.marginX, doc.y, {
          align: 'left',
          paragraphGap: 3,
          lineGap: 3
        });

      doc.y = lineY + lineHeight * 1.5;
      doc.moveDown(1);

      const responsibilities = exp.responsibilities || [];
      if (responsibilities.length > 0) {
        this._ensureSpaceForSubtitleSection(doc, responsibilities);
        if (this.pdfSettings.showSubTitle) {
          this._addSubTitle(doc, 'Key Qualifications & Responsibilities');
        }
        this._addBulletItems(doc, responsibilities, {
          bulletX: this.marginX,
          contentColor: defaultColor,
          lineGap: 3,
        });
      }

      const achievements = exp.achievements || [];
      if (achievements.length > 0) {
        const achievementBullets =
          responsibilities.length > 0
            ? [responsibilities[0], ...achievements]
            : achievements;

        this._ensureSpaceForSubtitleSection(doc, achievementBullets, {
          heightEstimateWidth: this.contentWidth,
        });
        if (this.pdfSettings.showSubTitle) {
          this._addSubTitle(doc, 'Key Achievements');
        }
        this._addBulletItems(doc, achievements, {
          bulletX: this.marginX,
          contentColor: defaultColor,
          lineGap: 3,
        });
      }

      if (this.pdfSettings.showCompanySkills) {
        this._addCompanySkills(doc, exp.skills);
      }

      doc.moveDown(0.3);
    }
    doc.moveDown(0.7);
  }

  private _addEducation(doc: any) {
    this._addSectionHeader(doc, 'EDUCATION');
    const educationList = this.data.education || [];

    for (const edu of educationList) {
      // Calculate space needed for this education entry
      const degreeFontSize = 12.5;
      const institutionFontSize = 11.5;
      const degreeHeight = degreeFontSize * 1.2;
      const institutionHeight = institutionFontSize * 1.2;
      const spacingAfterInstitution = institutionFontSize * 1; // moveDown(1)
      const minContentSpace = institutionFontSize * 1; // At least 1 line of spacing

      // Minimum space needed: degree + institution + spacing
      const minSpaceNeeded =
        degreeHeight +
        institutionHeight +
        spacingAfterInstitution +
        minContentSpace;

      const currentY = doc.y;
      const spaceAvailable = this.pageHeight - this.marginB - currentY;

      // Check if we need a page break before rendering the degree
      if (spaceAvailable < minSpaceNeeded) {
        doc.addPage();
      }

      // Render degree title
      doc
        .font(this.fontBold)
        .fontSize(degreeFontSize)
        // .fillColor('#2C3E50')
        .fillColor(defaultColor)
        .text(edu.degree || '', this.marginX, doc.y, {
          width: this.contentWidth,
          align: 'left',
          continued: true
        });

      const institution = edu.institution || '';
      const dateRange = edu.date_range || '';
      const location = edu.location || '';
      const institutionText = institution.trim();
      const dateLocation = location
        ? `${dateRange} | ${location}`.trim()
        : dateRange.trim();

      let graduated = "";
      if (dateRange.includes(" - ")) {
        graduated = dateRange.split(" - ")[1];
      } else if (dateRange.includes(" – ")) {
        graduated = dateRange.split(" – ")[1];
      }
      let graduatedYear = "";
      if (graduated.includes("/")) {
        graduatedYear = graduated.split("/")[1];
      } else if (graduated.includes(" ")) {
        graduatedYear = graduated.split(" ")[1];
      }
      let months = {
        "01": "Jan",
        "02": "Feb",
        "03": "Mar",
        "04": "Apr",
        "05": "May",
        "06": "Jun",
        "07": "Jul",
        "08": "Aug",
        "09": "Sep",
        "10": "Oct",
        "11": "Nov",
        "12": "Dec",
      };
      let graduatedMonth = ""
      if (graduated.split("/")[0].length < 3) {
        graduatedMonth = months[graduated.split("/")[0]];
      } else {
        graduatedMonth = graduated.split("/")[0].substring(0, 3);
      }

      // Render degree title
      if (graduatedMonth !== undefined && graduatedYear !== undefined) {
        doc
          .font(this.fontName)
          .fontSize(11.5)
          // .fillColor('#2C3E50')
          .fillColor(defaultColor)
          .text(` | ${institution} | Graduated ${graduatedMonth} ${graduatedYear}`, this.marginX, doc.y, {
            width: this.contentWidth,
            align: 'left',
          });
      } else {
        doc
          .font(this.fontName)
          .fontSize(11.5)
          // .fillColor('#2C3E50')
          .fillColor(defaultColor)
          .text(` | ${institution} | ${dateRange}`, this.marginX, doc.y, {
            width: this.contentWidth,
            align: 'left',
          });
      }
      doc.moveDown(1);
    }
  }

  private _addCertifications(doc: any) {
    const certifications = this.data.certifications || [];
    if (certifications.length === 0) {
      return;
    }

    const items = certifications
      .map((cert) => getCertificationText(cert))
      .filter(Boolean);

    if (items.length === 0) {
      return;
    }

    this._ensureSpaceForSubtitleSection(doc, items);
    this._addSectionHeader(doc, 'CERTIFICATIONS');
    this._addBulletItems(doc, items, {
      contentColor: defaultColor,
      lineGap: 3,
    });
    doc.moveDown(1);
  }

  async generate(): Promise<Buffer> {
    return new Promise(async (resolve, reject) => {
      try {
        const PDFDoc = (PDFKit as any).default || PDFKit;
        const doc = new PDFDoc({
          size: 'LETTER',
          margins: {
            top: this.marginT,
            bottom: this.marginB,
            left: this.marginX,
            right: this.marginX,
          },
        });

        this._registerFonts(doc);

        const buffers: Buffer[] = [];

        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
          const pdfBuffer = Buffer.concat(buffers);
          resolve(pdfBuffer);
        });
        doc.on('error', reject);
        this._addName(doc);
        if (this.pdfSettings.showTitle) {
          this._addTitle(doc);
        }
        this._addContact(doc);
        this._addSummary(doc);
        this._addSkills(doc);
        this._addExperience(doc);
        this._addEducation(doc);
        this._addCertifications(doc);

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }
}
