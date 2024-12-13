document.addEventListener("DOMContentLoaded", () => {
    // DOM Elements
    const paymentsTableBody = document.querySelector("#paymentsTable tbody");
    const filterDueDateSelect = document.getElementById("filterDueDate");
    const resetButton = document.getElementById("resetButton");
    const totalAmountElement = document.getElementById("totalAmount");
    const taxDueElement = document.getElementById("taxDue");

    // Constants
    const TAX_RATE = 0.06; // 6% tax rate

    /**
     * Fetches all payments from the API and populates the table.
     * @param {string|null} dueDate - Optional due date to filter results.
     */
    const fetchPayments = async (dueDate = null) => {
        try {
            let url = "/api/payments";
            if (dueDate) {
                url += `?due_date=${encodeURIComponent(dueDate)}`;
            }

            console.log(`Fetching payments from ${url}...`);
            const response = await fetch(url);
            if (!response.ok) throw new Error("Failed to fetch payments.");
            const payments = await response.json();

            // Populate table rows dynamically
            paymentsTableBody.innerHTML = payments.map(payment => `
                <tr>
                    <td>${payment.id}</td>
                    <td>${payment.company}</td>
                    <td>${payment.amount.toFixed(2)}</td>
                    <td>${payment.payment_date || "NA"}</td>
                    <td>${payment.status}</td>
                    <td>${payment.due_date}</td>
                </tr>
            `).join("");

            // Calculate totals
            const totalAmount = payments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
            const taxDue = totalAmount * TAX_RATE;

            // Update calculations in the UI
            totalAmountElement.textContent = `$${totalAmount.toFixed(2)}`;
            taxDueElement.textContent = `$${taxDue.toFixed(2)}`;
        } catch (error) {
            console.error("Error fetching payments:", error);
            alert("Failed to fetch payments. Please try again.");
        }
    };

    /**
     * Handles the filter dropdown change to filter payments by due date.
     */
    const handleFilterChange = () => {
        const dueDate = filterDueDateSelect.value;
        fetchPayments(dueDate || null);
    };

    /**
     * Resets the filter and fetches all payments.
     */
    const handleReset = () => {
        filterDueDateSelect.value = "";
        fetchPayments();
        totalAmountElement.textContent = "$0.00";
        taxDueElement.textContent = "$0.00";
    };

    // Event Listeners
    filterDueDateSelect.addEventListener("change", handleFilterChange);
    resetButton.addEventListener("click", handleReset);

    // Initialize the page by fetching all payments
    fetchPayments();
});
