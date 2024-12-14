document.addEventListener("DOMContentLoaded", async () => {
    const entryModal = document.getElementById("entryModal");
    const entryForm = document.getElementById("entryForm");
    const companyTableBody = document.querySelector("#companyTable tbody");
    const dueDateSelect = document.getElementById("due_date");
    const paymentDateSelect = document.getElementById("payment_date");
    const paymentDatePicker = document.getElementById("payment_date_picker");

    /**
     * Toggles the visibility of the Payment Date picker based on the selected option.
     */
    const toggleDatePicker = () => {
        if (paymentDateSelect.value === "pick_date") {
            paymentDatePicker.style.display = "block";
            paymentDatePicker.required = true;
        } else {
            paymentDatePicker.style.display = "none";
            paymentDatePicker.required = false;
            paymentDatePicker.value = ""; // Reset the value
        }
    };

    paymentDateSelect.addEventListener("change", toggleDatePicker);

    /**
     * Dynamically populates the Due Date dropdown.
     */
    const populateDueDates = () => {
        const currentYear = new Date().getFullYear();
        const dueDates = [
            `${currentYear}-04-15`,
            `${currentYear}-06-15`,
            `${currentYear}-09-15`,
            `${currentYear + 1}-01-15`,
        ];

        dueDateSelect.innerHTML = '<option value="">Select Due Date</option>';
        dueDates.forEach(date => {
            const option = document.createElement("option");
            option.value = date;
            option.textContent = new Date(date).toDateString();
            dueDateSelect.appendChild(option);
        });
    };

    /**
     * Fetches records from the database and populates the table without any frontend processing.
     */
    const fetchRecords = async () => {
        try {
            console.log("Fetching records from /api/records...");
            const response = await fetch("/api/records");
            if (!response.ok) throw new Error("Failed to fetch records.");
            const records = await response.json();

            // Directly display records as received from the backend
            companyTableBody.innerHTML = records.map(record => `
                <tr>
                    <td>${record.id}</td>
                    <td>${record.company}</td>
                    <td>${record.amount}</td>
                    <td>${record.payment_date || "NA"}</td>
                    <td>${record.status}</td>
                    <td>${record.due_date}</td>
                </tr>
            `).join("");
        } catch (error) {
            console.error("Error fetching records:", error);
            alert("Failed to fetch records. Please try again.");
        }
    };

    /**
     * Submits a new entry to the server.
     * Ensures the status field matches the database constraint.
     */
    const handleFormSubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData(entryForm);
        const data = Object.fromEntries(formData.entries());

        if (!data.due_date) {
            // Custom error message in an alert
            alert("Due Date is mandatory. Please enter a valid value.");
            return;
        }

        // Determine the payment date and calculate the status
        data.payment_date = paymentDateSelect.value === "pick_date" ? paymentDatePicker.value : null;
        data.status = data.payment_date ? "paid" : "unpaid"; // Ensure correct status value

        try {
            const response = await fetch("/api/records", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            if (!response.ok) throw new Error("Failed to save entry.");

            alert("Saved successfully!");
            closeModal(entryModal);
            fetchRecords();
        } catch (error) {
            console.error("Error saving entry:", error);
            alert("Failed to save the entry. Please try again.");
        }
    };

    /**
     * Opens the modal for adding an entry.
     */
    const openModal = () => {
        entryModal.classList.remove("hidden");
        entryModal.style.display = "block";
        populateDueDates();
    };

    /**
     * Closes the modal.
     */
    const closeModal = (modal) => {
        modal.classList.add("hidden");
        modal.style.display = "none";
        entryForm.reset();
    };

    // Event Listeners
    document.getElementById("addNewEntry").addEventListener("click", openModal);
    entryForm.addEventListener("submit", handleFormSubmit);
    document.querySelector(".close-modal").addEventListener("click", () => closeModal(entryModal));

    // Initialize
    populateDueDates();
    fetchRecords();
});
