let faultData = [];
let filteredData = [];
let sortDirection = 1;

// PDF Configuration
const PDF_FILENAME = "TS Flowchart_final A3-1.pdf";

document.getElementById('excelFile').addEventListener('change', handleFile, false);

function handleFile(e) {
    const reader = new FileReader();
    reader.onload = function(event) {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(sheet);

        faultData = json.map(item => ({
            code: item["Fault Code"]?.toString() || item["Fault code"]?.toString() || "",
            desc: item["Fault Description"] || item["fault description"] || item["Description"] || "",
            assy: item["Assembly"] || "",
            crit: item["Critical or not"] === "Critical" || item["critical or not"] === "Critical" ? "Critical" : "Not Critical"
        }));

        applyFilters();
    };
    reader.readAsArrayBuffer(e.target.files[0]);
}

function loadTable(data) {
    const tbody = document.getElementById("tableBody");
    tbody.innerHTML = "";
    
    data.forEach(item => {
        const row = document.createElement("tr");
        const badge = item.crit === "Critical" ? "badge-critical" : "badge-safe";

        row.innerHTML = `
            <td><strong>${item.code}</strong></td>
            <td>${item.desc}</td>
            <td>${item.assy}</td>
            <td>
                <span class="badge ${badge}" 
                onclick="showPopup('${item.code}', \`${item.desc}\`, \`${item.assy}\`, '${item.crit}')">
                ${item.crit}
                </span>
            </td>
        `;
        tbody.appendChild(row);
    });

    document.getElementById("totalCount").innerText = data.length;
    document.getElementById("criticalCount").innerText = data.filter(f => f.crit === "Critical").length;
}

function applyFilters() {
    const codeTerm = document.getElementById("codeSearch").value.toLowerCase();
    const generalTerm = document.getElementById("generalSearch").value.toLowerCase();
    const criticalOnly = document.getElementById("criticalOnly").checked;

    filteredData = faultData.filter(item => {
        return (
            item.code.toLowerCase().includes(codeTerm) &&
            (item.desc.toLowerCase().includes(generalTerm) || item.assy.toLowerCase().includes(generalTerm)) &&
            (!criticalOnly || item.crit === "Critical")
        );
    });
    loadTable(filteredData);
}

function sortTable(field) {
    sortDirection *= -1;
    filteredData.sort((a, b) => {
        if (a[field] < b[field]) return -1 * sortDirection;
        if (a[field] > b[field]) return 1 * sortDirection;
        return 0;
    });
    loadTable(filteredData);
}

function exportCSV() {
    let csv = "Code,Description,Assembly,Criticality\n";
    filteredData.forEach(row => {
        csv += `${row.code},"${row.desc}","${row.assy}",${row.crit}\n`;
    });
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "Fault_Report.csv";
    a.click();
}

// Logic to determine which PDF page to open based on keywords in description/assembly
function getPdfPageNumber(desc, assy) {
    const text = (desc + " " + assy).toLowerCase();
    
    // Mapping keywords to absolute PDF page numbers based on the Table of Contents
    if (text.includes('battery')) return 3;               // F1
    if (text.includes('compressor') || text.includes('aac')) return 4; // F2
    if (text.includes('panto')) return 5;                 // F3
    if (text.includes('vcb') || text.includes('vacuum circuit breaker')) return 6; // F4
    if (text.includes('ep brake')) return 7;              // F5
    if (text.includes('parking brake')) return 8;         // F6
    if (text.includes('plug door')) return 9;             // F7
    if (text.includes('adcr')) return 10;                 // F7a
    if (text.includes('mr pressure')) return 11;          // F8
    if (text.includes('bp pressure')) return 12;          // F9
    // if (text.includes('line converter') || text.includes('ltc')) return 13; // F10

    if (text.includes('line converter') || text.includes('ltc') || text.includes('traction converter') || text.includes('tcc')) return 13; // F10

    if (text.includes('auxiliary converter') || text.includes('acu')) return 14; // F11
    if (text.includes('air spring')) return 15;           // F12
    if (text.includes('vmax') || text.includes('v-max')) return 16; // F13
    
    return 2; // Default to Table of Contents page if no exact match is found
}

function showPopup(code, desc, assy, crit) {
    const popup = document.getElementById("popup");
    const box = document.getElementById("popupBox");
    const title = document.getElementById("popupTitle");
    const content = document.getElementById("popupContent");
    const closeBtn = document.querySelector(".close-btn");
    const solutionBtn = document.getElementById("solutionBtn");

    popup.style.display = "flex";

    if (crit === "Critical") {
        box.style.borderColor = "#ff0033";
        closeBtn.style.background = "#ff0033";
        title.innerHTML = "🔴 CRITICAL FAULT ALERT";
    } else {
        box.style.borderColor = "#00cc66";
        closeBtn.style.background = "#00cc66";
        title.innerHTML = "⚠️ NON-CRITICAL FAULT";
    }

    content.innerHTML = `
        <b>Fault Code:</b> ${code}<br><br>
        <b>Description:</b> ${desc}<br><br>
        <b>Assembly:</b> ${assy}<br><br>
        <b>Severity:</b> ${crit}<br><br>
        This classification indicates operational impact level.
    `;

    // Assign dynamic routing to the Solution button
    solutionBtn.onclick = function() {
        const pageNum = getPdfPageNumber(desc, assy);
        // Opens the PDF in a new tab targeted to the specific page
        window.open(`${PDF_FILENAME}#page=${pageNum}`, '_blank');
    };
}

function closePopup() {
    document.getElementById("popup").style.display = "none";
}