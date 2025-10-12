import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function generateAppointmentReceipt(appointment: any): Buffer {
  const doc = new jsPDF();

  // Header
  doc.setFontSize(20);
  doc.text('eChannelling', 105, 20, { align: 'center' });
  doc.setFontSize(12);
  doc.text('Appointment Receipt', 105, 30, { align: 'center' });

  // Appointment Details
  doc.setFontSize(10);
  const startY = 50;
  
  doc.text(`Appointment Number: ${appointment.appointmentNumber}`, 20, startY);
  doc.text(`Date Issued: ${new Date().toLocaleDateString()}`, 20, startY + 7);
  
  doc.line(20, startY + 12, 190, startY + 12);

  // Patient Information
  autoTable(doc, {
    startY: startY + 15,
    head: [['Patient Information', '']],
    body: [
      ['Name', appointment.patientName],
      ['Phone', appointment.patientPhone],
      ['NIC', appointment.patientNIC || 'N/A'],
    ],
    theme: 'grid',
  });

  // Doctor & Hospital Information
  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 10,
    head: [['Appointment Details', '']],
    body: [
      ['Doctor', appointment.doctorName],
      ['Specialty', appointment.specialty],
      ['Hospital', appointment.hospitalName],
      ['Date', new Date(appointment.sessionDate).toLocaleDateString()],
      ['Time', appointment.sessionTime],
    ],
    theme: 'grid',
  });

  // Payment Information
  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 10,
    head: [['Payment Information', '']],
    body: [
      ['Amount', `LKR ${appointment.amount.toFixed(2)}`],
      ['Status', appointment.paymentStatus],
    ],
    theme: 'grid',
  });

  // Footer
  const finalY = (doc as any).lastAutoTable.finalY;
  doc.setFontSize(8);
  doc.text(
    'Thank you for using eChannelling',
    105,
    finalY + 20,
    { align: 'center' }
  );

  return Buffer.from(doc.output('arraybuffer'));
}

export function generateBulkAppointmentReceipt(
  appointments: any[],
  totalAmount: number
): Buffer {
  const doc = new jsPDF();

  // Header
  doc.setFontSize(20);
  doc.text('eChannelling', 105, 20, { align: 'center' });
  doc.setFontSize(12);
  doc.text('Bulk Appointment Receipt', 105, 30, { align: 'center' });

  // Summary
  doc.setFontSize(10);
  doc.text(`Total Appointments: ${appointments.length}`, 20, 50);
  doc.text(`Total Amount: LKR ${totalAmount.toFixed(2)}`, 20, 57);
  doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 64);

  // Appointments Table
  const tableData = appointments.map((apt) => [
    apt.appointmentNumber,
    apt.patientName,
    apt.doctorName,
    new Date(apt.sessionDate).toLocaleDateString(),
    `LKR ${apt.amount.toFixed(2)}`,
  ]);

  autoTable(doc, {
    startY: 75,
    head: [['Appointment #', 'Patient', 'Doctor', 'Date', 'Amount']],
    body: tableData,
    theme: 'striped',
  });

  // Footer
  const finalY = (doc as any).lastAutoTable.finalY;
  doc.setFontSize(8);
  doc.text(
    'Thank you for using eChannelling',
    105,
    finalY + 15,
    { align: 'center' }
  );

  return Buffer.from(doc.output('arraybuffer'));
}