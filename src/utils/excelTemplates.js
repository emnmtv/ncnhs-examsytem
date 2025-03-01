import * as XLSX from 'xlsx';
import FileSaver from 'file-saver';

export const generateExamTemplate = () => {
  const wb = XLSX.utils.book_new();
  
  // Create instructions worksheet with detailed guidance
  const instructionsWS = XLSX.utils.aoa_to_sheet([
    ['Exam Template Instructions'],
    [''],
    ['Important Guidelines:'],
    ['1. Basic Rules:'],
    ['   • Do not modify column headers or sheet names'],
    ['   • Fill in all required fields in the Exam Details sheet'],
    ['   • Each question must have a question text and correct answer'],
    [''],
    ['2. Exam Details Sheet:'],
    ['   • Test Code: Unique identifier (e.g., MATH101, SCI202)'],
    ['   • Class Code: Class identifier (e.g., 7A-MATH, 8B-SCIENCE)'],
    ['   • Exam Title: Descriptive title of the exam'],
    [''],
    ['3. Question Types:'],
    ['   • multipleChoice: Use semicolons (;) to separate options'],
    ['   • true_false: Options are automatically set to true;false'],
    ['   • enumeration: Single correct answer, no options needed'],
    [''],
    ['4. Examples:'],
    ['   Multiple Choice:'],
    ['   Question: "What is the capital of France?"'],
    ['   Type: multipleChoice'],
    ['   Options: "London;Paris;Berlin;Madrid"'],
    ['   Answer: "Paris"'],
    [''],
    ['   True/False:'],
    ['   Question: "The Earth is round."'],
    ['   Type: true_false'],
    ['   Options: leave empty (auto-filled)'],
    ['   Answer: "true"'],
    [''],
    ['   Enumeration:'],
    ['   Question: "What is H2O commonly known as?"'],
    ['   Type: enumeration'],
    ['   Options: leave empty'],
    ['   Answer: "water"'],
    [''],
    ['5. Tips:'],
    ['   • Keep questions clear and concise'],
    ['   • Double-check correct answers'],
    ['   • Use appropriate question types for your content'],
    ['   • Test codes and class codes will be automatically converted to uppercase'],
  ]);

  // Create exam details worksheet with example
  const examDetailsWS = XLSX.utils.aoa_to_sheet([
    ['Test Code', 'Class Code', 'Exam Title'],
    ['MATH101', '7A-MATH', 'First Quarter Mathematics Examination'],
    ['(Your test code)', '(Your class code)', '(Your exam title)'],
  ]);

  // Create questions worksheet with comprehensive examples
  const questionsWS = XLSX.utils.aoa_to_sheet([
    ['Question Text', 'Question Type', 'Options (separate with ;)', 'Correct Answer'],
    ['What is 2 + 2?', 'multipleChoice', '3;4;5;6', '4'],
    ['The Earth is flat.', 'true_false', '', 'false'],
    ['What is the capital of France?', 'multipleChoice', 'London;Paris;Berlin;Madrid', 'Paris'],
    ['Water boils at 100 degrees Celsius at sea level.', 'true_false', '', 'true'],
    ['What is H2O commonly known as?', 'enumeration', '', 'water'],
    ['Which planet is known as the Red Planet?', 'multipleChoice', 'Venus;Mars;Jupiter;Saturn', 'Mars'],
    ['', 'multipleChoice', '', ''],
    ['(Add your questions here...)', '', '', ''],
  ]);

  // Add some style to worksheets (column widths)
  const wscols = [
    {wch: 40}, // Question Text
    {wch: 15}, // Question Type
    {wch: 30}, // Options
    {wch: 20}, // Correct Answer
  ];

  // Apply column widths
  questionsWS['!cols'] = wscols;
  
  // Add worksheets to workbook
  XLSX.utils.book_append_sheet(wb, instructionsWS, 'Instructions');
  XLSX.utils.book_append_sheet(wb, examDetailsWS, 'Exam Details');
  XLSX.utils.book_append_sheet(wb, questionsWS, 'Questions');

  // Generate buffer
  const wbout = XLSX.write(wb, { 
    type: 'array', 
    bookType: 'xlsx',
    bookSST: false
  });
  
  // Create blob and save file
  const blob = new Blob([wbout], { type: 'application/octet-stream' });
  FileSaver.saveAs(blob, 'exam_template.xlsx');
};

export const exportExamToExcel = (exam) => {
  const wb = XLSX.utils.book_new();

  // Prepare exam details
  const examDetails = [
    ['Test Code', 'Class Code', 'Exam Title'],
    [exam.testCode, exam.classCode, exam.examTitle],
  ];

  // Prepare questions
  const questions = [
    ['Question Text', 'Question Type', 'Options', 'Correct Answer'],
    ...exam.questions.map(q => [
      q.questionText,
      q.questionType,
      Array.isArray(q.options) ? q.options.join(';') : '',
      q.correctAnswer
    ])
  ];

  // Create worksheets
  const examDetailsWS = XLSX.utils.aoa_to_sheet(examDetails);
  const questionsWS = XLSX.utils.aoa_to_sheet(questions);

  // Add worksheets to workbook
  XLSX.utils.book_append_sheet(wb, examDetailsWS, 'Exam Details');
  XLSX.utils.book_append_sheet(wb, questionsWS, 'Questions');

  // Generate buffer and save
  const wbout = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
  const blob = new Blob([wbout], { type: 'application/octet-stream' });
  FileSaver.saveAs(blob, `${exam.testCode}_exam.xlsx`);
};

export const parseExcelFile = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });

        // Parse exam details
        const examDetailsSheet = workbook.Sheets['Exam Details'];
        const examDetails = XLSX.utils.sheet_to_json(examDetailsSheet, { header: 1 });
        
        // Parse questions
        const questionsSheet = workbook.Sheets['Questions'];
        const questionsData = XLSX.utils.sheet_to_json(questionsSheet, { header: 1 });

        // Remove header row and empty rows
        const validQuestions = questionsData.slice(1).filter(row => 
          row.length >= 4 && row[0] && row[1] && row[3]
        );

        // Format exam data
        const examData = {
          testCode: String(examDetails[1][0] || '').trim(),
          classCode: String(examDetails[1][1] || '').trim(),
          examTitle: String(examDetails[1][2] || '').trim(),
          questions: validQuestions.map(row => {
            const questionType = String(row[1] || '').trim();
            let options = [];

            // Handle options based on question type
            if (questionType === 'multipleChoice') {
              options = row[2] ? String(row[2]).split(';').filter(opt => opt.trim()) : [];
            } else if (questionType === 'true_false') {
              options = ['true', 'false'];
            }

            return {
              questionText: String(row[0] || '').trim(),
              questionType: questionType,
              options: options,
              correctAnswer: String(row[3] || '').trim()
            };
          })
        };

        // Validate the exam data
        if (!examData.testCode || !examData.classCode || !examData.examTitle) {
          throw new Error('Missing required exam details');
        }

        if (!examData.questions || examData.questions.length === 0) {
          throw new Error('No valid questions found in the Excel file');
        }

        resolve(examData);
      } catch (error) {
        reject(new Error(`Failed to parse Excel file: ${error.message}`));
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsArrayBuffer(file);
  });
}; 