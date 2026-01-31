import { getLuminexPrescriptions, getLuminexUsers } from './utils/storage-utils.js';

document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const prescriptionId = params.get('id');

    if (!prescriptionId) {
        document.body.innerHTML = '<h1>Reçete ID bulunamadı.</h1>';
        return;
    }

    const allPrescriptions = getLuminexPrescriptions();
    const prescription = allPrescriptions.find(p => p.id === prescriptionId);

    if (!prescription) {
        document.body.innerHTML = `<h1>Reçete bulunamadı (ID: ${prescriptionId})</h1>`;
        return;
    }

    const allUsers = getLuminexUsers();
    const patient = allUsers.find(u => u.tc === prescription.patientTc);

    // Populate header
    document.getElementById('prescriptionDate').textContent = new Date(prescription.date).toLocaleDateString('tr-TR');
    document.getElementById('prescriptionId').textContent = prescription.id;

    // Populate patient info
    document.getElementById('patientName').textContent = patient ? patient.name : 'Bilinmeyen Hasta';
    document.getElementById('patientTc').textContent = prescription.patientTc;
    document.getElementById('diagnosis').textContent = prescription.diagnosis;
    
    // Populate doctor info in footer
    document.getElementById('doctorName').textContent = prescription.doctorName;

    // Populate medicines table
    const tableBody = document.getElementById('medicinesTableBody');
    let tableHtml = '';
    prescription.medicines.forEach(med => {
        tableHtml += `
            <tr>
                <td>${med.name}</td>
                <td>${med.dosage}</td>
                <td>${med.instructions}</td>
            </tr>
        `;
    });
    tableBody.innerHTML = tableHtml;
});
