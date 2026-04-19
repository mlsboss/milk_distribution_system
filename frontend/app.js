// Simple test to see if JS loads
console.log("JavaScript file loaded successfully!");
console.log("Current URL:", window.location.href);
console.log("Document readyState:", document.readyState);

// Temporary offline storage functions
async function saveOfflineEntry(data) {
    console.log("Offline save:", data);
}

async function getOfflineEntries() {
    return [];
}

async function deleteOfflineEntry(id) {
    console.log("Offline delete:", id);
}

async function parseErrorResponse(response) {
    const text = await response.text();
    if (!text) {
        return response.statusText || "Request failed";
    }

    try {
        const data = JSON.parse(text);
        return data.detail || data.message || text;
    } catch {
        return text;
    }
}

function getNetworkErrorMessage(error) {
    if (error instanceof TypeError) {
        return "Could not reach the API. Check the backend URL, CORS settings, and whether the Render service is awake.";
    }

    return error.message || "Network request failed";
}

function parseCurrencyAmount(value) {
    const matches = String(value).match(/-?\d+(?:\.\d+)?/g);
    return matches ? parseFloat(matches[matches.length - 1]) : 0;
}

function formatMoney(amount) {
    return "Rs. " + (Number(amount) || 0).toFixed(2);
}

function getRateValue(milkType, personType) {
    return rates[`${milkType}_${personType}`] || 0;
}

const configuredApiUrl = window.MILK_API_URL || localStorage.getItem("MILK_API_URL");
const API = configuredApiUrl ||
    `${window.location.protocol}//${window.location.hostname || "127.0.0.1"}:8000`;

let milk_type = "buffalo";
let shift = "AM";
let person_type = "supplier";
let suppliersMap = {};
let customersMap = {};
let rates = {};
let ratePersonType = "supplier"; // Track which type of rates we're viewing
let selectedRateMilkType = "cow";
let editId = null;
let currentReportType = "supplier";
let currentReportData = null;
let dairyShift = "AM";

// ---------- INIT ----------
window.addEventListener("DOMContentLoaded", async () => {
    console.log("=== DOMContentLoaded fired ===");
    console.log("DOM is ready, starting initialization...");
    try {
        setToday();
        console.log("Set today");
    } catch (e) {
        console.error("Failed to set today:", e);
    }

    try {
        setDefaultShifts();
        console.log("Set default shifts");
    } catch (e) {
        console.error("Failed to set default shifts:", e);
    }

    try {
        setDefaultReportDates();
        console.log("Set default report dates");
    } catch (e) {
        console.error("Failed to set default report dates:", e);
    }

    try {
        await loadSuppliers();
        console.log("Loaded suppliers");
    } catch (e) {
        console.error("Failed to load suppliers:", e);
    }

    try {
        await loadCustomers();
        console.log("Loaded customers");
    } catch (e) {
        console.error("Failed to load customers:", e);
    }

    try {
        await loadRates();
        console.log("Loaded rates");
    } catch (e) {
        console.error("Failed to load rates:", e);
    }

    try {
        await loadSupplierEntries();
        console.log("Loaded supplier entries");
    } catch (e) {
        console.error("Failed to load supplier entries:", e);
    }

    try {
        await loadCustomerEntries();
        console.log("Loaded customer entries");
    } catch (e) {
        console.error("Failed to load customer entries:", e);
    }

    try {
        await loadDairyEntries();
        console.log("Loaded dairy entries");
    } catch (e) {
        console.error("Failed to load dairy entries:", e);
    }

    attachEvents();
    console.log("=== attachEvents() completed ===");
    setupTabs();
    console.log("=== setupTabs() completed ===");
    console.log("=== Initialization complete ===");
});

// ---------- TABS ----------
function setupTabs() {
    console.log("Setting up tabs...");
    const tabButtons = document.querySelectorAll('.tab-btn');
    console.log("Found tab buttons:", tabButtons.length);
    tabButtons.forEach(btn => {
        console.log("Attaching click listener to tab:", btn.getAttribute('data-tab'));
        btn.addEventListener('click', () => {
            const tabName = btn.getAttribute('data-tab');
            console.log("Tab clicked:", tabName);
            switchTab(tabName);
        });
    });
}

function switchTab(tabName) {
    console.log("Switching to tab:", tabName);
    // Hide all tabs
    document.querySelectorAll(".tab-content").forEach(tab => {
        tab.classList.remove("active");
    });

    // Remove active from all buttons
    document.querySelectorAll(".tab-btn").forEach(btn => {
        btn.classList.remove("active");
    });

    // Show selected tab
    const targetTab = document.getElementById(tabName);
    if (targetTab) {
        targetTab.classList.add("active");
        console.log("Activated tab:", tabName);
    } else {
        console.error("Tab not found:", tabName);
    }

    // Mark button as active
    const targetButton = document.querySelector(`[data-tab="${tabName}"]`);
    if (targetButton) {
        targetButton.classList.add("active");
        console.log("Activated button for tab:", tabName);
    } else {
        console.error("Button not found for tab:", tabName);
    }
}

// ---------- EVENTS ----------
function attachEvents(){
    console.log("Attaching events...");

    // Supplier Entry tab
    const supplierCowBtn = document.getElementById("supplierCowBtn");
    if (!supplierCowBtn) console.error("supplierCowBtn not found!");
    else supplierCowBtn.addEventListener("click", () => setSupplierMilk("cow"));

    const supplierBuffaloBtn = document.getElementById("supplierBuffaloBtn");
    if (!supplierBuffaloBtn) console.error("supplierBuffaloBtn not found!");
    else supplierBuffaloBtn.addEventListener("click", () => setSupplierMilk("buffalo"));

    const supplierAMBtn = document.getElementById("supplierAMBtn");
    if (!supplierAMBtn) console.error("supplierAMBtn not found!");
    else supplierAMBtn.addEventListener("click", () => setSupplierShift("AM"));

    const supplierPMBtn = document.getElementById("supplierPMBtn");
    if (!supplierPMBtn) console.error("supplierPMBtn not found!");
    else supplierPMBtn.addEventListener("click", () => setSupplierShift("PM"));

    const supplierSaveBtn = document.getElementById("supplierSaveBtn");
    if (!supplierSaveBtn) console.error("supplierSaveBtn not found!");
    else supplierSaveBtn.addEventListener("click", saveSupplier);

    const supplierClearBtn = document.getElementById("supplierClearBtn");
    if (!supplierClearBtn) console.error("supplierClearBtn not found!");
    else supplierClearBtn.addEventListener("click", clearSupplierForm);

    const supplierLitres = document.getElementById("supplierLitres");
    if (!supplierLitres) console.error("supplierLitres not found!");
    else supplierLitres.addEventListener("input", calculateSupplier);

    const supplierFat = document.getElementById("supplierFat");
    if (!supplierFat) console.error("supplierFat not found!");
    else supplierFat.addEventListener("input", calculateSupplier);

    const supplierId = document.getElementById("supplierId");
    if (!supplierId) console.error("supplierId not found!");
    else supplierId.addEventListener("input", fetchSupplier);

    const supplierDate = document.getElementById("supplierDate");
    if (!supplierDate) console.error("supplierDate not found!");
    else supplierDate.addEventListener("change", loadSupplierEntries);

    console.log("Supplier events attached");

    // Customer Entry tab
    const customerCowBtn = document.getElementById("customerCowBtn");
    if (!customerCowBtn) console.error("customerCowBtn not found!");
    else customerCowBtn.addEventListener("click", () => setCustomerMilk("cow"));

    const customerBuffaloBtn = document.getElementById("customerBuffaloBtn");
    if (!customerBuffaloBtn) console.error("customerBuffaloBtn not found!");
    else customerBuffaloBtn.addEventListener("click", () => setCustomerMilk("buffalo"));

    const customerAMBtn = document.getElementById("customerAMBtn");
    if (!customerAMBtn) console.error("customerAMBtn not found!");
    else customerAMBtn.addEventListener("click", () => setCustomerShift("AM"));

    const customerPMBtn = document.getElementById("customerPMBtn");
    if (!customerPMBtn) console.error("customerPMBtn not found!");
    else customerPMBtn.addEventListener("click", () => setCustomerShift("PM"));

    const customerSaveBtn = document.getElementById("customerSaveBtn");
    if (!customerSaveBtn) console.error("customerSaveBtn not found!");
    else customerSaveBtn.addEventListener("click", saveCustomer);

    const customerClearBtn = document.getElementById("customerClearBtn");
    if (!customerClearBtn) console.error("customerClearBtn not found!");
    else customerClearBtn.addEventListener("click", clearCustomerForm);

    const customerLitres = document.getElementById("customerLitres");
    if (!customerLitres) console.error("customerLitres not found!");
    else customerLitres.addEventListener("input", calculateCustomer);

    const customerId = document.getElementById("customerId");
    if (!customerId) console.error("customerId not found!");
    else customerId.addEventListener("input", fetchCustomer);

    const customerDate = document.getElementById("customerDate");
    if (!customerDate) console.error("customerDate not found!");
    else customerDate.addEventListener("change", loadCustomerEntries);

    console.log("Customer events attached");

    document.getElementById("reportBtn").addEventListener("click", getReport);
    document.getElementById("exportBtn").addEventListener("click", exportReport);
    document.getElementById("reportSearch").addEventListener("input", filterReport);

    // Report type buttons
    document.getElementById("supplierReportBtn").addEventListener("click", () => setReportType("supplier"));
    document.getElementById("customerReportBtn").addEventListener("click", () => setReportType("customer"));
    document.getElementById("dairyReportBtn").addEventListener("click", () => setReportType("dairy"));

    // Rates tab
    document.getElementById("ratesSupplierBtn").addEventListener("click", () => setRatePersonType("supplier"));
    document.getElementById("ratesCustomerBtn").addEventListener("click", () => setRatePersonType("customer"));
    document.getElementById("ratesCowBtn").addEventListener("click", () => setRateMilkType("cow"));
    document.getElementById("ratesBuffaloBtn").addEventListener("click", () => setRateMilkType("buffalo"));
    document.getElementById("updateRateBtn").addEventListener("click", updateRate);

    // Suppliers tab
    document.getElementById("addSupplierBtn").addEventListener("click", addSupplier);
    document.getElementById("addCustomerBtn").addEventListener("click", addCustomer);
    document.getElementById("makePaymentBtn").addEventListener("click", makePayment);

    // Dairy tab
    document.getElementById("dairyAMBtn").addEventListener("click", () => setDairyShift("AM"));
    document.getElementById("dairyPMBtn").addEventListener("click", () => setDairyShift("PM"));
    document.getElementById("saveDairyBtn").addEventListener("click", saveDairy);
    document.getElementById("clearDairyBtn").addEventListener("click", clearDairyForm);
    console.log("All events attached successfully");
}

// ---------- TAB NAVIGATION ----------
function switchTab(tabName){
    // Hide all tabs
    document.querySelectorAll(".tab-content").forEach(tab => {
        tab.classList.remove("active");
    });

    // Remove active from all buttons
    document.querySelectorAll(".tab-btn").forEach(btn => {
        btn.classList.remove("active");
    });

    // Show selected tab
    const targetTab = document.getElementById(tabName);
    if (targetTab) {
        targetTab.classList.add("active");
    }

    // Mark button as active
    const targetButton = document.querySelector(`[data-tab="${tabName}"]`);
    if (targetButton) {
        targetButton.classList.add("active");
    }
}

// ---------- DATE ----------
function setToday(){
    let today = new Date().toISOString().split("T")[0];

    // Set dates for supplier and customer tabs
    document.getElementById("supplierDate").value = today;
    document.getElementById("customerDate").value = today;

    document.getElementById("startDate").max = today;
    document.getElementById("endDate").max = today;
}

function setDefaultReportDates(){
    let today = new Date();
    let fortnightAgo = new Date(today);
    fortnightAgo.setDate(today.getDate() - 14);

    document.getElementById("startDate").value = fortnightAgo.toISOString().split("T")[0];
    document.getElementById("endDate").value = today.toISOString().split("T")[0];
}

function setDefaultShifts(){
    const now = new Date();
    const currentHour = now.getHours();
    const currentShift = currentHour < 12 ? "AM" : "PM";
    
    // Set default shifts for supplier and customer forms
    setSupplierShift(currentShift);
    setCustomerShift(currentShift);
    setDairyShift(currentShift);
    
    // Set default milk types
    setSupplierMilk("buffalo");
    setCustomerMilk("buffalo");
}

// ---------- BUTTONS ----------

function setPersonType(type){
    person_type = type;

    document.querySelectorAll(".person-btn").forEach(b=>b.classList.remove("active"));
    document.getElementById(type+"Btn").classList.add("active");

    // Clear name display when switching types
    document.getElementById("nameDisplay").innerText = "";
    document.getElementById("id").value = "";
}

function setReportType(type){
    currentReportType = type;

    document.querySelectorAll(".report-type-btn").forEach(b=>b.classList.remove("active"));
    document.getElementById(type+"ReportBtn").classList.add("active");

    // Clear search when switching types
    document.getElementById("reportSearch").value = "";
}

// ---------- RATES ----------
async function loadRates(){
    try {
        let res = await fetch(API+"/rates/");
        let data = await res.json();

        rates = {};
        data.forEach(r => {
            const key = `${r.milk_type}_${r.person_type}`;
            rates[key] = r.rate;
        });

        displayRates();
    } catch {
        console.log("Rates load failed");
        rates = {};
    }
}

function displayRates(){
    let html = `
        <div>
            <h4>${ratePersonType === "supplier" ? "Supplier" : "Customer"} Rates</h4>
            <div class="rate-card">
                <h4>Cow Milk</h4>
                <div class="rate-display">${rates[`cow_${ratePersonType}`] ? formatMoney(rates[`cow_${ratePersonType}`]) : "-"} per litre</div>
            </div>
            <div class="rate-card">
                <h4>Buffalo Milk</h4>
                <div class="rate-display">${rates[`buffalo_${ratePersonType}`] ? formatMoney(rates[`buffalo_${ratePersonType}`]) : "-"} per litre</div>
            </div>
        </div>
    `;
    document.getElementById("currentRates").innerHTML = html;
}

function setRatePersonType(type){
    ratePersonType = type;
    document.querySelectorAll("#rates .person-btn").forEach(b=>b.classList.remove("active"));
    document.getElementById("rates"+type.charAt(0).toUpperCase()+type.slice(1)+"Btn").classList.add("active");
    document.getElementById("newRateInput").value = rates[`${selectedRateMilkType}_${ratePersonType}`] || "";
    displayRates();
}

function setRateMilkType(type){
    selectedRateMilkType = type;
    document.querySelectorAll("#rates .milk-btn").forEach(b=>b.classList.remove("active"));
    document.getElementById("rates"+type.charAt(0).toUpperCase()+type.slice(1)+"Btn").classList.add("active");
    document.getElementById("newRateInput").value = rates[`${selectedRateMilkType}_${ratePersonType}`] || "";
}

async function updateRate(){
    const newRate = Number(document.getElementById("newRateInput").value);
    const rateStatus = document.getElementById("rateStatus");

    if (!newRate || newRate <= 0) {
        rateStatus.innerHTML = '<div class="notification error">Please enter a valid rate</div>';
        return;
    }

    try {
        const oldRate = rates[`${selectedRateMilkType}_${ratePersonType}`];

        let res = await fetch(`${API}/rates/${selectedRateMilkType}/${ratePersonType}`, {
            method: "PUT",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({ rate: newRate })
        });

        let data = await res.json();

        if (res.ok) {
            rates[`${selectedRateMilkType}_${ratePersonType}`] = newRate;
            displayRates();
            rateStatus.innerHTML = `
                <div class="notification success">
                    Rate updated successfully<br>
                    ${selectedRateMilkType.toUpperCase()} (${ratePersonType}): ${formatMoney(oldRate || 0)} to ${formatMoney(newRate)}
                </div>
            `;
            calculateSupplier();
            calculateCustomer();
            setTimeout(() => {
                rateStatus.innerHTML = "";
            }, 3000);
        } else {
            rateStatus.innerHTML = '<div class="notification error">Failed to update rate</div>';
        }
    } catch {
        rateStatus.innerHTML = '<div class="notification error">Error updating rate</div>';
    }
}

// ---------- SUPPLIERS ----------
async function loadSuppliers(){
    try{
        let res = await fetch(API+"/suppliers/");
        let data = await res.json();

        suppliersMap = {};
        data.forEach(s=> suppliersMap[s.id]=s.name);

        displaySuppliers(data);

    }catch{
        console.log("Supplier load failed");
    }
}

function displaySuppliers(suppliers){
    let html = "";
    suppliers.forEach(s => {
        html += `
            <div class="supplier-item">
                <div class="supplier-info">
                    <strong>ID:</strong> ${s.id} | <strong>Name:</strong> ${s.name}
                </div>
                <div class="supplier-actions">
                    <button class="delete-btn" onclick="deleteSupplier(${s.id})">Delete</button>
                </div>
            </div>
        `;
    });

    if (suppliers.length === 0) {
        html = "<p style='text-align: center; color: #999;'>No suppliers added yet</p>";
    }

    document.getElementById("suppliersList").innerHTML = html;
}

async function addSupplier(){
    const supplierId = Number(document.getElementById("manageSupplierId").value);
    const supplierName = document.getElementById("manageSupplierName").value;
    const supplierStatus = document.getElementById("manageSupplierStatus");

    if (!supplierId || !supplierName) {
        supplierStatus.innerHTML = '<div class="notification error">Please fill in all fields</div>';
        return;
    }

    try {
        let res = await fetch(API+"/suppliers/", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({
                id: supplierId,
                name: supplierName
            })
        });

        if (res.ok) {
            supplierStatus.innerHTML = '<div class="notification success">Supplier added successfully</div>';
            document.getElementById("manageSupplierId").value = "";
            document.getElementById("manageSupplierName").value = "";
            
            setTimeout(() => {
                supplierStatus.innerHTML = "";
            }, 2000);

            await loadSuppliers();
        } else {
            const error = await parseErrorResponse(res);
            supplierStatus.innerHTML = `<div class="notification error">${error || "Failed to add supplier"}</div>`;
        }
    } catch (error) {
        supplierStatus.innerHTML = `<div class="notification error">${getNetworkErrorMessage(error)}</div>`;
    }
}

window.deleteSupplier = async function(id){
    if (!confirm("Are you sure you want to delete this supplier?")) return;

    try {
        let res = await fetch(`${API}/suppliers/${id}`, {
            method: "DELETE"
        });

        if (res.ok) {
            loadSuppliers();
        }
    } catch {
        alert("Error deleting supplier");
    }
};

// ---------- CUSTOMERS ----------
async function loadCustomers(){
    try{
        let res = await fetch(API+"/customers/");
        let data = await res.json();

        customersMap = {};
        data.forEach(c=> customersMap[c.id]=c.name);

        displayCustomers(data);

    }catch{
        console.log("Customer load failed");
    }
}

function displayCustomers(customers){
    let html = "";
    customers.forEach(c => {
        const balanceClass = c.balance >= 0 ? "balance-positive" : "balance-negative";
        const balanceText = c.balance >= 0 ? formatMoney(c.balance) : `-${formatMoney(Math.abs(c.balance))}`;

        html += `
            <div class="supplier-item">
                <div class="supplier-info">
                    <strong>ID:</strong> ${c.id} | <strong>Name:</strong> ${c.name}
                    <br><strong>Balance:</strong> <span class="${balanceClass}">${balanceText}</span>
                </div>
                <div class="supplier-actions">
                    <button class="delete-btn" onclick="deleteCustomer(${c.id})">Delete</button>
                </div>
            </div>
        `;
    });

    if (customers.length === 0) {
        html = "<p style='text-align: center; color: #999;'>No customers added yet</p>";
    }

    document.getElementById("customersList").innerHTML = html;
}

async function addCustomer(){
    const customerId = Number(document.getElementById("manageCustomerId").value);
    const customerName = document.getElementById("manageCustomerName").value;
    const customerStatus = document.getElementById("manageCustomerStatus");

    if (!customerId || !customerName) {
        customerStatus.innerHTML = '<div class="notification error">Please fill in all fields</div>';
        return;
    }

    try {
        let res = await fetch(API+"/customers/", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({
                id: customerId,
                name: customerName
            })
        });

        if (res.ok) {
            customerStatus.innerHTML = '<div class="notification success">Customer added successfully</div>';
            document.getElementById("manageCustomerId").value = "";
            document.getElementById("manageCustomerName").value = "";
            setTimeout(() => {
                customerStatus.innerHTML = "";
            }, 2000);

            await loadCustomers();
        } else {
            const error = await parseErrorResponse(res);
            customerStatus.innerHTML = `<div class="notification error">${error || "Failed to add customer"}</div>`;
        }
    } catch (error) {
        customerStatus.innerHTML = `<div class="notification error">${getNetworkErrorMessage(error)}</div>`;
    }
}

window.deleteCustomer = async function(id){
    if (!confirm("Are you sure you want to delete this customer?")) return;

    try {
        let res = await fetch(`${API}/customers/${id}`, {
            method: "DELETE"
        });

        if (res.ok) {
            loadCustomers();
        }
    } catch {
        alert("Error deleting customer");
    }
};

// ---------- PAYMENTS ----------
async function makePayment(){
    const customerId = Number(document.getElementById("paymentCustomerId").value);
    const amount = Number(document.getElementById("paymentAmount").value);
    const paymentStatus = document.getElementById("paymentStatus");

    if (!customerId || !amount || amount <= 0) {
        paymentStatus.innerHTML = '<div class="notification error">Please enter valid customer ID and payment amount</div>';
        return;
    }

    try {
        let res = await fetch(API+"/payments/", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({
                customer_id: customerId,
                amount: amount
            })
        });

        if (res.ok) {
            paymentStatus.innerHTML = '<div class="notification success">Payment recorded successfully</div>';
            document.getElementById("paymentCustomerId").value = "";
            document.getElementById("paymentAmount").value = "";

            setTimeout(() => {
                paymentStatus.innerHTML = "";
            }, 2000);

            await loadCustomers(); // Refresh to show updated balances
        } else {
            const error = await parseErrorResponse(res);
            paymentStatus.innerHTML = `<div class="notification error">${error || "Failed to record payment"}</div>`;
        }
    } catch (error) {
        paymentStatus.innerHTML = `<div class="notification error">${getNetworkErrorMessage(error)}</div>`;
    }
}

// ---------- CALC ----------

// ---------- SAVE ----------
setInterval(async ()=>{
    let data = await getOfflineEntries();

    for(let d of data){
        try{
            await fetch(API+"/transactions/",{
                method:"POST",
                headers:{"Content-Type":"application/json"},
                body:JSON.stringify(d)
            });

            await deleteOfflineEntry(d.id);

        }catch{
            return;
        }
    }

},5000);

// ---------- LOAD ENTRIES ----------

window.deleteEntry = async function(id, type, date, shift, milkType, personId, litres, fat, amount) {
    const confirmed = confirm(
        `Delete this entry?\n\nDate: ${new Date(date).toLocaleDateString()} ${shift}\n${type === "supplier" ? "Supplier" : "Customer"} ID: ${personId}\nMilk: ${milkType}\nLitres: ${litres}L\nFat: ${fat}%\nAmount: ${formatMoney(amount)}`
    );

    if (!confirmed) return;

    try {
        let res = await fetch(`${API}/transactions/${id}`, {
            method: "DELETE"
        });

        if (res.ok) {
            if (type === "supplier") {
                await loadSupplierEntries();
                document.getElementById("supplierStatus").innerText = "Entry deleted";
                document.getElementById("supplierStatus").style.color = "green";
            } else {
                await loadCustomerEntries();
                await loadCustomers();
                document.getElementById("customerStatus").innerText = "Entry deleted";
                document.getElementById("customerStatus").style.color = "green";
            }
        } else {
            const error = await res.json();
            const statusElement = type === "supplier" ? "supplierStatus" : "customerStatus";
            document.getElementById(statusElement).innerText = error.detail || "Unable to delete entry";
            document.getElementById(statusElement).style.color = "red";
        }
    } catch (err) {
        const statusElement = type === "supplier" ? "supplierStatus" : "customerStatus";
        document.getElementById(statusElement).innerText = "Delete failed";
        document.getElementById(statusElement).style.color = "red";
        console.error(err);
    }
};

// ---------- REPORT ----------
async function getReport(){

    let start = document.getElementById("startDate").value;
    let end = document.getElementById("endDate").value;

    if (!start || !end) {
        document.getElementById("reportSummary").innerHTML = '<div class="notification error">Please select both start and end dates</div>';
        return;
    }

    try {
        let res = await fetch(`${API}/reports/fortnight?start=${start}&end=${end}`);
        let data = await res.json();

        // Apply search filter if present
        const searchTerm = document.getElementById("reportSearch").value.trim();
        if (searchTerm) {
            const filteredData = { ...data };
            if (currentReportType === "supplier") {
                filteredData.suppliers = data.suppliers.filter(s =>
                    String(s.id).includes(searchTerm) || s.name.toLowerCase().includes(searchTerm)
                );
                filteredData.supplier_details = data.supplier_details.filter(d =>
                    String(d.supplier_id).includes(searchTerm) || d.name.toLowerCase().includes(searchTerm)
                );
                filteredData.supplier_breakdown = data.supplier_breakdown.filter(s =>
                    String(s.id).includes(searchTerm) || s.name.toLowerCase().includes(searchTerm)
                );
            } else if (currentReportType === "customer") {
                filteredData.customers = data.customers.filter(c =>
                    String(c.id).includes(searchTerm) || c.name.toLowerCase().includes(searchTerm)
                );
                filteredData.customer_details = data.customer_details.filter(d =>
                    String(d.customer_id).includes(searchTerm) || d.name.toLowerCase().includes(searchTerm)
                );
                filteredData.customer_breakdown = data.customer_breakdown.filter(c =>
                    String(c.id).includes(searchTerm) || c.name.toLowerCase().includes(searchTerm)
                );
                filteredData.balances = data.balances.filter(b =>
                    b.name.toLowerCase().includes(searchTerm)
                );
            }
            currentReportData = data;
            displayReport(filteredData);
        } else {
            currentReportData = data;
            displayReport(data);
        }

    } catch (error) {
        document.getElementById("reportSummary").innerHTML = '<div class="notification error">Error loading report data</div>';
        console.error("Report error:", error);
    }
}

function displayReport(data) {
    let summaryHtml = "";
    let tableHtml = "";

    if (currentReportType === "supplier") {
        summaryHtml = generateSupplierSummary(data);
        tableHtml = generateSupplierTable(data) + generateSupplierDetailTable(data);
    } else if (currentReportType === "customer") {
        summaryHtml = generateCustomerSummary(data);
        tableHtml = generateCustomerTable(data) + generateCustomerDetailTable(data);
    } else if (currentReportType === "dairy") {
        summaryHtml = generateDairySummary(data);
        tableHtml = generateDairyTable(data);
    }

    document.getElementById("reportSummary").innerHTML = summaryHtml;
    document.getElementById("reportTable").innerHTML = tableHtml;
}

function getShiftTotals(records) {
    const totals = {
        AM: { litres: 0, amount: 0 },
        PM: { litres: 0, amount: 0 },
        combined: { litres: 0, amount: 0 }
    };

    records.forEach(record => {
        ["AM", "PM"].forEach(shiftName => {
            const shiftData = record[shiftName] || {};
            totals[shiftName].litres += shiftData.litres || 0;
            totals[shiftName].amount += shiftData.amount || 0;
            totals.combined.litres += shiftData.litres || 0;
            totals.combined.amount += shiftData.amount || 0;
        });
    });

    return totals;
}

function generateShiftSummaryRows(totals) {
    return `
        <table class="report-table summary-table">
            <thead>
                <tr>
                    <th>Shift</th>
                    <th>Litres</th>
                    <th>Amount</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>AM</td>
                    <td>${totals.AM.litres.toFixed(2)} L</td>
                    <td>${formatMoney(totals.AM.amount)}</td>
                </tr>
                <tr>
                    <td>PM</td>
                    <td>${totals.PM.litres.toFixed(2)} L</td>
                    <td>${formatMoney(totals.PM.amount)}</td>
                </tr>
                <tr class="total-row">
                    <td><strong>Combined</strong></td>
                    <td><strong>${totals.combined.litres.toFixed(2)} L</strong></td>
                    <td><strong>${formatMoney(totals.combined.amount)}</strong></td>
                </tr>
            </tbody>
        </table>
    `;
}

function generateSupplierSummary(data) {
    const totalLitres = data.suppliers.reduce((sum, s) => sum + (s.litres || 0), 0);
    const totalAmount = data.suppliers.reduce((sum, s) => sum + (s.amount || 0), 0);
    const shiftTotals = getShiftTotals(data.supplier_breakdown || []);

    return `
        <h4>Supplier Report Summary</h4>
        <p><strong>Total Suppliers:</strong> ${data.suppliers.length}</p>
        <p><strong>Total Litres:</strong> ${totalLitres.toFixed(2)} L</p>
        <p><strong>Total Amount:</strong> ${formatMoney(totalAmount)}</p>
        ${generateShiftSummaryRows(shiftTotals)}
    `;
}

function generateSupplierTable(data) {
    let html = `
        <table class="report-table">
            <thead>
                <tr>
                    <th>Supplier ID</th>
                    <th>Supplier Name</th>
                    <th>Total Litres</th>
                    <th>Total Amount</th>
                </tr>
            </thead>
            <tbody>
    `;

    data.suppliers.forEach(supplier => {
        html += `
            <tr>
                <td>${supplier.id}</td>
                <td>${supplier.name}</td>
                <td>${(supplier.litres || 0).toFixed(2)} L</td>
                <td>${formatMoney(supplier.amount)}</td>
            </tr>
        `;
    });

    const totalLitres = data.suppliers.reduce((sum, s) => sum + (s.litres || 0), 0);
    const totalAmount = data.suppliers.reduce((sum, s) => sum + (s.amount || 0), 0);

    html += `
            <tr class="total-row">
                <td colspan="2"><strong>TOTAL</strong></td>
                <td><strong>${totalLitres.toFixed(2)} L</strong></td>
                <td><strong>${formatMoney(totalAmount)}</strong></td>
            </tr>
        </tbody>
        </table>
    `;

    return html;
}

function generateSupplierDetailTable(data) {
    if (!data.supplier_details || data.supplier_details.length === 0) {
        return "";
    }

    let html = `
        <h4>Supplier Transaction Details</h4>
        <table class="report-table">
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Shift</th>
                    <th>Supplier ID</th>
                    <th>Name</th>
                    <th>Litres</th>
                    <th>Fat</th>
                    <th>Amount</th>
                </tr>
            </thead>
            <tbody>
    `;

    data.supplier_details.forEach(record => {
        html += `
            <tr>
                <td>${new Date(record.date).toLocaleDateString()}</td>
                <td>${record.shift}</td>
                <td>${record.supplier_id}</td>
                <td>${record.name}</td>
                <td>${(record.litres || 0).toFixed(2)} L</td>
                <td>${(record.fat || 0).toFixed(2)}%</td>
                <td>${formatMoney(record.amount)}</td>
            </tr>
        `;
    });

    html += `
            </tbody>
        </table>
    `;

    return html;
}

function generateCustomerSummary(data) {
    const totalLitres = data.customers.reduce((sum, c) => sum + (c.litres || 0), 0);
    const totalAmount = data.customers.reduce((sum, c) => sum + (c.amount || 0), 0);
    const shiftTotals = getShiftTotals(data.customer_breakdown || []);

    return `
        <h4>Customer Report Summary</h4>
        <p><strong>Total Customers:</strong> ${data.customers.length}</p>
        <p><strong>Total Litres:</strong> ${totalLitres.toFixed(2)} L</p>
        <p><strong>Total Amount:</strong> ${formatMoney(totalAmount)}</p>
        ${generateShiftSummaryRows(shiftTotals)}
    `;
}

function generateCustomerTable(data) {
    let html = `
        <table class="report-table">
            <thead>
                <tr>
                    <th>Customer ID</th>
                    <th>Customer Name</th>
                    <th>Total Litres</th>
                    <th>Total Amount</th>
                    <th>Current Balance</th>
                </tr>
            </thead>
            <tbody>
    `;

    data.customers.forEach(customer => {
        const balance = data.balances.find(b => b.name === customer.name);
        const balanceValue = balance ? balance.balance : 0;
        const balanceClass = balanceValue >= 0 ? "balance-positive" : "balance-negative";

        html += `
            <tr>
                <td>${customer.id}</td>
                <td>${customer.name}</td>
                <td>${(customer.litres || 0).toFixed(2)} L</td>
                <td>${formatMoney(customer.amount)}</td>
                <td><span class="${balanceClass}">${formatMoney(Math.abs(balanceValue))}</span></td>
            </tr>
        `;
    });

    const totalLitres = data.customers.reduce((sum, c) => sum + (c.litres || 0), 0);
    const totalAmount = data.customers.reduce((sum, c) => sum + (c.amount || 0), 0);
    const totalBalance = data.balances.reduce((sum, b) => sum + (b.balance || 0), 0);

    html += `
            <tr class="total-row">
                <td colspan="2"><strong>TOTAL</strong></td>
                <td><strong>${totalLitres.toFixed(2)} L</strong></td>
                <td><strong>${formatMoney(totalAmount)}</strong></td>
                <td><strong>${formatMoney(Math.abs(totalBalance))}</strong></td>
            </tr>
        </tbody>
        </table>
    `;

    return html;
}

function generateCustomerDetailTable(data) {
    if (!data.customer_details || data.customer_details.length === 0) {
        return "";
    }

    let html = `
        <h4>Customer Transaction Details</h4>
        <table class="report-table">
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Shift</th>
                    <th>Customer ID</th>
                    <th>Name</th>
                    <th>Litres</th>
                    <th>Fat</th>
                    <th>Amount</th>
                </tr>
            </thead>
            <tbody>
    `;

    data.customer_details.forEach(record => {
        html += `
            <tr>
                <td>${new Date(record.date).toLocaleDateString()}</td>
                <td>${record.shift}</td>
                <td>${record.customer_id}</td>
                <td>${record.name}</td>
                <td>${(record.litres || 0).toFixed(2)} L</td>
                <td>${(record.fat || 0).toFixed(2)}%</td>
                <td>${formatMoney(record.amount)}</td>
            </tr>
        `;
    });

    html += `
            </tbody>
        </table>
    `;

    return html;
}

function generateDairySummary(data) {
    let totalLitres = 0;
    let totalAmount = 0;
    let entryCount = 0;
    const shiftTotals = {
        AM: { litres: 0, amount: 0 },
        PM: { litres: 0, amount: 0 },
        combined: { litres: 0, amount: 0 }
    };

    Object.values(data.dairy).forEach(dateData => {
        ["AM", "PM"].forEach(shiftName => {
            const shiftData = dateData[shiftName];
            if (shiftData) {
                totalLitres += shiftData.litres || 0;
                totalAmount += shiftData.amount || 0;
                shiftTotals[shiftName].litres += shiftData.litres || 0;
                shiftTotals[shiftName].amount += shiftData.amount || 0;
                shiftTotals.combined.litres += shiftData.litres || 0;
                shiftTotals.combined.amount += shiftData.amount || 0;
                entryCount++;
            }
        });
    });

    return `
        <h4>Dairy Report Summary</h4>
        <p><strong>Total Entries:</strong> ${entryCount}</p>
        <p><strong>Total Litres:</strong> ${totalLitres.toFixed(2)} L</p>
        <p><strong>Total Amount:</strong> ${formatMoney(totalAmount)}</p>
        ${generateShiftSummaryRows(shiftTotals)}
    `;
}

function generateDairyTable(data) {
    let html = `
        <table class="report-table">
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Shift</th>
                    <th>Litres</th>
                    <th>Fat</th>
                    <th>SNF</th>
                    <th>Amount</th>
                </tr>
            </thead>
            <tbody>
    `;

    let totalLitres = 0;
    let totalAmount = 0;

    Object.keys(data.dairy).sort().reverse().forEach(date => {
        const dateData = data.dairy[date];
        ['AM', 'PM'].forEach(shift => {
            const shiftData = dateData[shift];
            if (shiftData) {
                html += `
                    <tr>
                        <td>${new Date(date).toLocaleDateString()}</td>
                        <td>${shift}</td>
                        <td>${shiftData.litres.toFixed(2)} L</td>
                        <td>${shiftData.fat.toFixed(2)}%</td>
                        <td>${shiftData.snf.toFixed(2)}%</td>
                        <td>${formatMoney(shiftData.amount)}</td>
                    </tr>
                `;
                totalLitres += shiftData.litres || 0;
                totalAmount += shiftData.amount || 0;
            }
        });
    });

    html += `
            <tr class="total-row">
                <td colspan="2"><strong>TOTAL</strong></td>
                <td><strong>${totalLitres.toFixed(2)} L</strong></td>
                <td colspan="2"></td>
                <td><strong>${formatMoney(totalAmount)}</strong></td>
            </tr>
        </tbody>
        </table>
    `;

    return html;
}

function filterReport() {
    if (!currentReportData) return;

    const searchTerm = document.getElementById("reportSearch").value.toLowerCase();

    if (!searchTerm) {
        displayReport(currentReportData);
        return;
    }

    const filteredData = { ...currentReportData };

    if (currentReportType === "supplier") {
        filteredData.suppliers = currentReportData.suppliers.filter(s =>
            String(s.id).includes(searchTerm) || s.name.toLowerCase().includes(searchTerm)
        );
        filteredData.supplier_details = currentReportData.supplier_details.filter(d =>
            String(d.supplier_id).includes(searchTerm) || d.name.toLowerCase().includes(searchTerm)
        );
        filteredData.supplier_breakdown = currentReportData.supplier_breakdown.filter(s =>
            String(s.id).includes(searchTerm) || s.name.toLowerCase().includes(searchTerm)
        );
    } else if (currentReportType === "customer") {
        filteredData.customers = currentReportData.customers.filter(c =>
            String(c.id).includes(searchTerm) || c.name.toLowerCase().includes(searchTerm)
        );
        filteredData.customer_details = currentReportData.customer_details.filter(d =>
            String(d.customer_id).includes(searchTerm) || d.name.toLowerCase().includes(searchTerm)
        );
        filteredData.customer_breakdown = currentReportData.customer_breakdown.filter(c =>
            String(c.id).includes(searchTerm) || c.name.toLowerCase().includes(searchTerm)
        );
        filteredData.balances = currentReportData.balances.filter(b =>
            b.name.toLowerCase().includes(searchTerm)
        );
    } else if (currentReportType === "dairy") {
        const filteredDairy = {};
        Object.keys(currentReportData.dairy).forEach(date => {
            if (date.includes(searchTerm) ||
                new Date(date).toLocaleDateString().toLowerCase().includes(searchTerm)) {
                filteredDairy[date] = currentReportData.dairy[date];
            }
        });
        filteredData.dairy = filteredDairy;
    }

    displayReport(filteredData);
}

function exportReport() {
    if (!currentReportData) {
        alert("Please generate a report first");
        return;
    }

    let csvContent = "";

    if (currentReportType === "supplier") {
        csvContent = "Supplier ID,Supplier Name,Total Litres,Total Amount\n";
        currentReportData.suppliers.forEach(s => {
            csvContent += `"${s.id}","${s.name}",${s.litres || 0},${s.amount || 0}\n`;
        });

        if (currentReportData.supplier_details && currentReportData.supplier_details.length) {
            csvContent += "\nDate,Shift,Supplier ID,Supplier Name,Litres,Fat,Amount\n";
            currentReportData.supplier_details.forEach(d => {
                csvContent += `${d.date},${d.shift},${d.supplier_id},"${d.name}",${d.litres || 0},${d.fat || 0},${d.amount || 0}\n`;
            });
        }
    } else if (currentReportType === "customer") {
        csvContent = "Customer ID,Customer Name,Total Litres,Total Amount,Current Balance\n";
        currentReportData.customers.forEach(c => {
            const balance = currentReportData.balances.find(b => b.name === c.name);
            const balanceValue = balance ? balance.balance : 0;
            csvContent += `"${c.id}","${c.name}",${c.litres || 0},${c.amount || 0},${balanceValue}\n`;
        });

        if (currentReportData.customer_details && currentReportData.customer_details.length) {
            csvContent += "\nDate,Shift,Customer ID,Customer Name,Litres,Fat,Amount\n";
            currentReportData.customer_details.forEach(d => {
                csvContent += `${d.date},${d.shift},${d.customer_id},"${d.name}",${d.litres || 0},${d.fat || 0},${d.amount || 0}\n`;
            });
        }
    } else if (currentReportType === "dairy") {
        csvContent = "Date,Shift,Litres,Fat,SNF,Amount\n";
        Object.keys(currentReportData.dairy).sort().reverse().forEach(date => {
            const dateData = currentReportData.dairy[date];
            ['AM', 'PM'].forEach(shift => {
                const shiftData = dateData[shift];
                if (shiftData) {
                    csvContent += `${date},${shift},${shiftData.litres || 0},${shiftData.fat || 0},${shiftData.snf || 0},${shiftData.amount || 0}\n`;
                }
            });
        });
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${currentReportType}_report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// ---------- DAIRY ----------
// ---------- DAIRY ----------
function setDairyShift(s) {
    dairyShift = s;

    document.querySelectorAll("#dairy .shift-btn").forEach(b => b.classList.remove("active"));
    document.getElementById("dairy" + s + "Btn").classList.add("active");
}

async function saveDairy() {
    const date = document.getElementById("dairyDate").value;
    const litres = Number(document.getElementById("dairyLitres").value);
    const fat = Number(document.getElementById("dairyFat").value);
    const snf = Number(document.getElementById("dairySnf").value);
    const amount = Number(document.getElementById("dairyAmount").value);
    const status = document.getElementById("dairyStatus");

    if (!date || !litres || litres <= 0 || !fat || fat <= 0 || !snf || snf <= 0 || !amount || amount <= 0) {
        status.innerHTML = '<div class="notification error">Please fill in all fields with valid values</div>';
        return;
    }

    const data = {
        date: date,
        shift: dairyShift,
        litres: litres,
        fat: fat,
        snf: snf,
        amount: amount
    };

    try {
        let res = await fetch(API + "/dairy/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });

        if (res.ok) {
            status.innerHTML = '<div class="notification success">Dairy entry saved successfully</div>';
            clearDairyForm();
            loadDairyEntries();
            setTimeout(() => {
                status.innerHTML = "";
            }, 3000);
        } else {
            const error = await res.json();
            status.innerHTML = `<div class="notification error">${error.detail || "Failed to save dairy entry"}</div>`;
        }
    } catch {
        status.innerHTML = '<div class="notification error">Error saving dairy entry</div>';
    }
}

function clearDairyForm() {
    document.getElementById("dairyDate").value = new Date().toISOString().split("T")[0];
    document.getElementById("dairyLitres").value = "";
    document.getElementById("dairyFat").value = "";
    document.getElementById("dairySnf").value = "";
    document.getElementById("dairyAmount").value = "";
}

async function loadDairyEntries() {
    try {
        let res = await fetch(API + "/dairy/");
        let data = await res.json();

        displayDairyEntries(data);
    } catch {
        console.log("Dairy entries load failed");
        document.getElementById("dairyEntries").innerHTML = "<p>Failed to load dairy entries</p>";
    }
}

function displayDairyEntries(entries) {
    if (!entries || entries.length === 0) {
        document.getElementById("dairyEntries").innerHTML = "<p style='text-align: center; color: #999;'>No dairy entries yet</p>";
        return;
    }

    // Sort by date descending, then by shift
    entries.sort((a, b) => {
        if (a.date !== b.date) {
            return new Date(b.date) - new Date(a.date);
        }
        return a.shift === 'AM' ? -1 : 1;
    });

    let html = "";
    entries.slice(0, 10).forEach(entry => {  // Show last 10 entries
        const dateStr = new Date(entry.date).toLocaleDateString();
        html += `
            <div class="dairy-entry">
                <h4>${dateStr} - ${entry.shift} Shift</h4>
                <p><strong>Litres:</strong> ${entry.litres.toFixed(2)} L</p>
                <p><strong>Fat:</strong> ${entry.fat.toFixed(2)}% | <strong>SNF:</strong> ${entry.snf.toFixed(2)}%</p>
                <p><strong>Amount:</strong> ${formatMoney(entry.amount)}</p>
            </div>
        `;
    });

    document.getElementById("dairyEntries").innerHTML = html;
}

// ---------- SUPPLIER ENTRY FUNCTIONS ----------
let supplierMilk = "";
let supplierShift = "";

function setSupplierMilk(milk){
    supplierMilk = milk;
    document.getElementById("supplierCowBtn").classList.toggle("active", milk === "cow");
    document.getElementById("supplierBuffaloBtn").classList.toggle("active", milk === "buffalo");
    calculateSupplier();
}

function setSupplierShift(shift){
    supplierShift = shift;
    document.getElementById("supplierAMBtn").classList.toggle("active", shift === "AM");
    document.getElementById("supplierPMBtn").classList.toggle("active", shift === "PM");
}

function calculateSupplier(){
    const litres = parseFloat(document.getElementById("supplierLitres").value) || 0;
    const fat = parseFloat(document.getElementById("supplierFat").value) || 0;
    if (litres > 0 && fat > 0 && supplierMilk){
        const rate = getRateValue(supplierMilk, "supplier");
        const amount = litres * (fat * rate / 10);
        document.getElementById("supplierAmount").innerText = formatMoney(amount);
    } else {
        document.getElementById("supplierAmount").innerText = formatMoney(0);
    }
}

function fetchSupplier(){
    const id = document.getElementById("supplierId").value;
    if (id){
        fetch(`${API}/suppliers/${id}`)
            .then(res => {
                if (!res.ok) throw new Error("Supplier not found");
                return res.json();
            })
            .then(supplier => {
                document.getElementById("supplierNameDisplay").innerText = supplier.name;
                document.getElementById("supplierNameDisplay").style.color = "green";
            })
            .catch(err => {
                console.error("Error fetching supplier:", err);
                document.getElementById("supplierNameDisplay").innerText = "Invalid supplier ID";
                document.getElementById("supplierNameDisplay").style.color = "red";
            });
    } else {
        document.getElementById("supplierNameDisplay").innerText = "";
    }
}

function saveSupplier(){
    const id = document.getElementById("supplierId").value;
    const name = document.getElementById("supplierNameDisplay").innerText;
    const litres = parseFloat(document.getElementById("supplierLitres").value);
    const fat = parseFloat(document.getElementById("supplierFat").value);
    const amountText = document.getElementById("supplierAmount").innerText;
    const amount = parseCurrencyAmount(amountText);
    const date = document.getElementById("supplierDate").value;
    const shift = supplierShift;

    if (!id || !name || name === "Invalid supplier ID" || !suppliersMap[id]){
        alert("Supplier ID not found. Please add the supplier in People & Payments first, then make the entry.");
        return;
    }

    if (!litres || !fat || !amount || !date || !shift || !supplierMilk){
        alert("Please fill all fields and ensure a supplier milk type, date, and shift are selected");
        return;
    }

    const transaction = {
        person_id: id,
        person_type: "supplier",
        name: name,
        litres: litres,
        fat: fat,
        amount: amount,
        milk_type: supplierMilk,
        date: date,
        shift: shift
    };

    saveTransaction(transaction, "supplier");
}

function clearSupplierForm(){
    document.getElementById("supplierId").value = "";
    document.getElementById("supplierNameDisplay").innerText = "";
    document.getElementById("supplierLitres").value = "";
    document.getElementById("supplierFat").value = "";
    document.getElementById("supplierAmount").innerText = formatMoney(0);
    document.getElementById("supplierDate").value = new Date().toISOString().split('T')[0];
    setSupplierMilk("");
    setSupplierShift("");
}

// ---------- CUSTOMER ENTRY FUNCTIONS ----------
let customerMilk = "";
let customerShift = "";

function setCustomerMilk(milk){
    customerMilk = milk;
    document.getElementById("customerCowBtn").classList.toggle("active", milk === "cow");
    document.getElementById("customerBuffaloBtn").classList.toggle("active", milk === "buffalo");
    calculateCustomer();
}

function setCustomerShift(shift){
    customerShift = shift;
    document.getElementById("customerAMBtn").classList.toggle("active", shift === "AM");
    document.getElementById("customerPMBtn").classList.toggle("active", shift === "PM");
}

function calculateCustomer(){
    const litres = parseFloat(document.getElementById("customerLitres").value) || 0;
    const rate = getRateValue(customerMilk, "customer");
    if (litres > 0 && rate > 0){
        const amount = litres * rate;
        document.getElementById("customerAmount").innerText = formatMoney(amount);
    } else {
        document.getElementById("customerAmount").innerText = formatMoney(0);
    }
}

function fetchCustomer(){
    const id = document.getElementById("customerId").value;
    if (id){
        fetch(`${API}/customers/${id}`)
            .then(res => {
                if (!res.ok) throw new Error("Customer not found");
                return res.json();
            })
            .then(customer => {
                document.getElementById("customerNameDisplay").innerText = customer.name;
                document.getElementById("customerNameDisplay").style.color = "green";
            })
            .catch(err => {
                console.error("Error fetching customer:", err);
                document.getElementById("customerNameDisplay").innerText = "Invalid customer ID";
                document.getElementById("customerNameDisplay").style.color = "red";
            });
    } else {
        document.getElementById("customerNameDisplay").innerText = "";
    }
}

function saveCustomer(){
    const id = document.getElementById("customerId").value;
    const name = document.getElementById("customerNameDisplay").innerText;
    const litres = parseFloat(document.getElementById("customerLitres").value);
    const amountText = document.getElementById("customerAmount").innerText;
    const amount = parseCurrencyAmount(amountText);
    const date = document.getElementById("customerDate").value;
    const shift = customerShift;

    if (!id || !name || name === "Invalid customer ID" || !customersMap[id]){
        alert("Customer ID not found. Please add the customer in People & Payments first, then make the entry.");
        return;
    }

    if (!litres || !amount || !date || !shift || !customerMilk){
        alert("Please fill all fields and ensure a customer milk type, date, and shift are selected");
        return;
    }

    const transaction = {
        person_id: id,
        person_type: "customer",
        name: name,
        litres: litres,
        fat: 0, // Customers don't have fat, set to 0
        milk_type: customerMilk,
        date: date,
        shift: shift
    };

    saveTransaction(transaction, "customer");
}

function clearCustomerForm(){
    document.getElementById("customerId").value = "";
    document.getElementById("customerNameDisplay").innerText = "";
    document.getElementById("customerLitres").value = "";
    document.getElementById("customerAmount").innerText = formatMoney(0);
    document.getElementById("customerDate").value = new Date().toISOString().split('T')[0];
    setCustomerMilk("");
    setCustomerShift("");
}

// ---------- SHARED FUNCTIONS ----------
async function saveTransaction(transaction, type){
    try{
        const payload = {
            person_id: Number(transaction.person_id),
            person_type: transaction.person_type,
            litres: transaction.litres,
            fat: transaction.fat,
            milk_type: transaction.milk_type,
            shift: transaction.shift,
            date: transaction.date
        };

        let res = await fetch(API+"/transactions/",{
            method:"POST",
            headers:{"Content-Type":"application/json"},
            body:JSON.stringify(payload)
        });

        if (res.ok) {
            const statusElement = type === "supplier" ? "supplierStatus" : "customerStatus";
            document.getElementById(statusElement).innerText = "Saved";
            document.getElementById(statusElement).style.color = "green";
            
            if (type === "supplier") {
                clearSupplierForm();
                await loadSupplierEntries();
            } else {
                clearCustomerForm();
                await loadCustomerEntries();
                await loadCustomers();
            }
        } else {
            const error = await res.json();
            const statusElement = type === "supplier" ? "supplierStatus" : "customerStatus";
            document.getElementById(statusElement).innerText = error.detail || "Error saving";
            document.getElementById(statusElement).style.color = "red";
        }

    }catch{
        await saveOfflineEntry(transaction);
        const statusElement = type === "supplier" ? "supplierStatus" : "customerStatus";
        document.getElementById(statusElement).innerText = "Saved Offline";
        document.getElementById(statusElement).style.color = "orange";
    }
}

async function loadSupplierEntries(){
    try {
        let res = await fetch(API+"/transactions/?person_type=supplier");
        let data = await res.json();

        let selected = document.getElementById("supplierDate").value;
        let html="";

        data.forEach(t=>{
            let d = t.date.split("T")[0];

            if(d!==selected) return;

            let milkAbbrev = t.milk_type === "cow" ? "CM" : "BM";

            html+=`
            <div class="card entry-card">
                <div class="entry-text">
                    ${t.person_id} | ${milkAbbrev} | ${t.litres}L | ${t.fat}% | ${formatMoney(t.amount)}
                </div>
                <button class="delete-entry-btn" onclick="deleteEntry(${t.id}, 'supplier', '${t.date}', '${t.shift}', '${milkAbbrev}', ${t.person_id}, ${t.litres}, ${t.fat}, ${t.amount})">x</button>
            </div>`;
        });

        document.getElementById("supplierEntries").innerHTML=html;
    } catch (error) {
        console.error("Error loading supplier entries:", error);
        document.getElementById("supplierEntries").innerHTML = "<p>Failed to load entries</p>";
    }
}

async function loadCustomerEntries(){
    try {
        let res = await fetch(API+"/transactions/?person_type=customer");
        let data = await res.json();

        let selected = document.getElementById("customerDate").value;
        let html="";

        data.forEach(t=>{
            let d = t.date.split("T")[0];

            if(d!==selected) return;

            let milkAbbrev = t.milk_type === "cow" ? "CM" : "BM";

            html+=`
            <div class="card entry-card">
                <div class="entry-text">
                    ${t.person_id} | ${milkAbbrev} | ${t.litres}L | ${formatMoney(t.amount)}
                </div>
                <button class="delete-entry-btn" onclick="deleteEntry(${t.id}, 'customer', '${t.date}', '${t.shift}', '${milkAbbrev}', ${t.person_id}, ${t.litres}, 0, ${t.amount})">x</button>
            </div>`;
        });

        document.getElementById("customerEntries").innerHTML=html;
    } catch (error) {
        console.error("Error loading customer entries:", error);
        document.getElementById("customerEntries").innerHTML = "<p>Failed to load entries</p>";
    }
}

