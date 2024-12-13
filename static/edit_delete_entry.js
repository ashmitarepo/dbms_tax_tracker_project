document.addEventListener("DOMContentLoaded", async () => {
    console.log("Document loaded and DOM fully parsed.");

    // Helper Functions

    /**
     * Retrieves the value of a query parameter from the URL.
     * @param {string} key - The name of the query parameter.
     * @returns {string|null} - The value of the query parameter, or null if not found.
     */
    const getQueryParam = (key) => {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(key);
    };

    /**
     * Creates a notification popup element dynamically.
     * @param {string} message - The notification message.
     * @param {boolean} [isError=false] - Whether the notification is for an error.
     */
    const createNotification = (message, isError = false) => {
        const existingNotification = document.querySelector(".notification");
        if (existingNotification) {
            existingNotification.remove();
        }

        const notification = document.createElement("div");
        notification.className = `notification ${isError ? "error" : "success"}`;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 3000);
    };

    /**
     * Populates the due date dropdown with dynamically generated options.
     * @param {string} [selectedDate=""] - The selected date to pre-select in the dropdown.
     */
    const populateDueDateOptions = (selectedDate = "") => {
        const select = document.getElementById("editDueDate");
        select.innerHTML = ""; // Clear existing options

        const currentYear = new Date().getFullYear();
        const nextYear = currentYear + 1;
        const dates = [
            { label: `April 15, ${currentYear}`, value: `${currentYear}-04-15` },
            { label: `June 15, ${currentYear}`, value: `${currentYear}-06-15` },
            { label: `September 15, ${currentYear}`, value: `${currentYear}-09-15` },
            { label: `January 15, ${nextYear}`, value: `${nextYear}-01-15` },
        ];

        dates.forEach((date) => {
            const option = document.createElement("option");
            option.value = date.value;
            option.textContent = date.label;
            if (date.value === selectedDate) {
                option.selected = true;
            }
            select.appendChild(option);
        });
    };

    /**
     * Opens a modal dialog.
     * @param {string} modalId - The ID of the modal to open.
     */
    const openModal = (modalId) => {
        const modal = document.getElementById(modalId);
        modal.classList.remove("hidden");
        modal.style.display = "block";
    };

    /**
     * Closes a modal dialog.
     * @param {string} modalId - The ID of the modal to close.
     */
    const closeModal = (modalId) => {
        const modal = document.getElementById(modalId);
        modal.classList.add("hidden");
        modal.style.display = "none";
    };

    /**
     * Opens the delete confirmation modal and sets up its event listeners.
     * @param {string} recordId - The ID of the record to delete.
     */
    const openDeleteModal = (recordId) => {
        if (!recordId) {
            console.error("Error: recordId is undefined.");
            return;
        }

        openModal("deleteModal");

        document.getElementById("confirmDelete").onclick = async () => {
            try {
                const response = await fetch(`/api/records/${recordId}`, { method: "DELETE" });

                if (response.ok) {
                    createNotification("Record deleted successfully!");
                    await fetchRecords();
                } else {
                    createNotification("Failed to delete record. Please try again.", true);
                }
            } catch (error) {
                console.error("Error deleting record:", error);
                createNotification("An error occurred while deleting the record.", true);
            } finally {
                closeModal("deleteModal");
            }
        };

        document.getElementById("cancelDelete").onclick = () => closeModal("deleteModal");
    };

    // Main Functions

    /**
     * Fetches records from the API and populates the table.
     */
    const fetchRecords = async () => {
        try {
            const response = await fetch("/api/records");
            if (!response.ok) throw new Error("Failed to fetch records.");
            const records = await response.json();

            const companyFilter = getQueryParam("company");
            const filteredRecords = companyFilter
                ? records.filter((record) => record.company === companyFilter)
                : records;

            const tbody = document.querySelector("#taxTable tbody");
            tbody.innerHTML = filteredRecords
                .map(
                    (record) => `
                <tr>
                    <td>${record.id}</td>
                    <td>${record.company}</td>
                    <td>${record.amount}</td>
                    <td>${record.payment_date || "N/A"}</td>
                    <td>${record.status}</td>
                    <td>${record.due_date}</td>
                    <td>
                        <button class="edit" data-id="${record.id}">Edit</button>
                        <button class="delete" data-id="${record.id}">Delete</button>
                    </td>
                </tr>
            `
                )
                .join("");
            attachActionListeners();
        } catch (error) {
            console.error("Error fetching records:", error);
        }
    };

    /**
     * Attaches event listeners for Edit and Delete buttons.
     */
    const attachActionListeners = () => {
        document.querySelectorAll(".edit").forEach((button) => {
            button.addEventListener("click", async (e) => {
                const recordId = e.target.dataset.id;

                try {
                    const response = await fetch(`/api/records/${recordId}`);
                    if (!response.ok) throw new Error("Record not found");

                    const record = await response.json();
                    document.getElementById("editId").value = record.id;
                    document.getElementById("editCompany").value = record.company;
                    document.getElementById("editAmount").value = record.amount || "";
                    document.getElementById("editPaymentDate").value = record.payment_date || "";
                    populateDueDateOptions(record.due_date);

                    openModal("editModal");
                } catch (error) {
                    console.error("Error fetching record for editing:", error);
                    alert("Could not load record. Please try again.");
                }
            });
        });

        document.querySelectorAll(".delete").forEach((button) => {
            button.addEventListener("click", (e) => {
                const recordId = e.target.dataset.id;
                openDeleteModal(recordId);
            });
        });
    };

    // Event Listeners

    document.querySelector(".close-modal").addEventListener("click", () => closeModal("editModal"));

    document.getElementById("editForm").addEventListener("submit", async (e) => {
        e.preventDefault();
        const recordId = document.getElementById("editId").value;

        const updatedRecord = {
            amount: document.getElementById("editAmount").value,
            payment_date: document.getElementById("editPaymentDate").value,
            due_date: document.getElementById("editDueDate").value,
        };

        try {
            await fetch(`/api/records/${recordId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updatedRecord),
            });

            closeModal("editModal");
            fetchRecords();
            createNotification("Record saved successfully!");
        } catch (error) {
            console.error("Error updating record:", error);
        }
    });

    console.log("Initializing fetch for records...");
    fetchRecords();
});
