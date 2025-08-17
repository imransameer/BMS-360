// Profile page functionality
document.addEventListener('DOMContentLoaded', function() {
    // Get the user settings form
    const userSettingsForm = document.getElementById('userSettingsForm');
    const businessDetailsForm = document.getElementById('businessDetailsForm');
    const changePasswordBtn = document.getElementById('changePasswordBtn');
    const passwordField = document.getElementById('password');
    const passwordToggleBtn = document.getElementById('passwordToggle');

    // Initialize toasts
    const toastElements = document.querySelectorAll('.toast');
    const toasts = [...toastElements].map(toastEl => new bootstrap.Toast(toastEl));

    // Dynamic greeting based on time of day
    updateGreeting();
    
    // Dynamic date display
    updateDateDisplay();
    
    // Set up date click handler for calendar popup
    setupDateClickHandler();

    // Load user data from server (this will now load both user and business data)
    loadUserData();
    
    // Set a placeholder password to show in the field
    passwordField.value = '••••••••';
    
    // Clear the password field when it receives focus
    passwordField.addEventListener('focus', function() {
        if (this.value === '••••••••') {
            this.value = '';
        }
    });
    
    // Restore placeholder if user leaves the field empty
    passwordField.addEventListener('blur', function() {
        if (this.value === '') {
            this.value = '••••••••';
        }
    });

    // Toggle password visibility
    if (passwordToggleBtn) {
        passwordToggleBtn.addEventListener('click', function() {
            const type = passwordField.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordField.setAttribute('type', type);
            
            // Toggle icon
            const icon = this.querySelector('i');
            if (type === 'text') {
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
                this.setAttribute('title', 'Hide password');
            } else {
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
                this.setAttribute('title', 'Show password');
            }
        });
    }

    // Change password button functionality
    if (changePasswordBtn) {
        changePasswordBtn.addEventListener('click', function() {
            // Create a modal for changing password
            const modalHTML = `
                <div class="modal fade" id="changePasswordModal" tabindex="-1" aria-labelledby="changePasswordModalLabel" aria-hidden="true">
                    <div class="modal-dialog">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title" id="changePasswordModalLabel">Change Password</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                            </div>
                            <div class="modal-body">
                                <form id="changePasswordForm">
                                    <div class="mb-3">
                                        <label for="current_password" class="form-label">Current Password</label>
                                        <div class="input-group">
                                            <span class="input-group-text"><i class="fas fa-lock text-gray-400"></i></span>
                                            <input type="password" class="form-control" id="current_password" name="current_password" required>
                                        </div>
                                    </div>
                                    <div class="mb-3">
                                        <label for="new_password" class="form-label">New Password</label>
                                        <div class="input-group">
                                            <span class="input-group-text"><i class="fas fa-key text-gray-400"></i></span>
                                            <input type="password" class="form-control" id="new_password" name="new_password" required>
                                        </div>
                                    </div>
                                    <div class="mb-3">
                                        <label for="confirm_password" class="form-label">Confirm New Password</label>
                                        <div class="input-group">
                                            <span class="input-group-text"><i class="fas fa-check-circle text-gray-400"></i></span>
                                            <input type="password" class="form-control" id="confirm_password" name="confirm_password" required>
                                        </div>
                                    </div>
                                </form>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                                <button type="button" class="btn btn-primary" id="savePasswordBtn">Save Changes</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            // Add the modal to the DOM
            const modalContainer = document.createElement('div');
            modalContainer.innerHTML = modalHTML;
            document.body.appendChild(modalContainer);
            
            // Show the modal
            const modal = new bootstrap.Modal(document.getElementById('changePasswordModal'));
            modal.show();
            
            // Handle save password button
            document.getElementById('savePasswordBtn').addEventListener('click', function() {
                const currentPassword = document.getElementById('current_password').value.trim();
                const newPassword = document.getElementById('new_password').value.trim();
                const confirmPassword = document.getElementById('confirm_password').value.trim();
                
                // Validate inputs
                if (!currentPassword || !newPassword || !confirmPassword) {
                    alert('All password fields are required.');
                    return;
                }
                
                if (newPassword !== confirmPassword) {
                    alert('New passwords do not match.');
                    return;
                }
                
                // Submit the password change
                changePassword({
                    current_password: currentPassword,
                    new_password: newPassword,
                    confirm_password: confirmPassword
                }, modal);
            });
            
            // Remove the modal from the DOM when it's closed
            document.getElementById('changePasswordModal').addEventListener('hidden.bs.modal', function() {
                modalContainer.remove();
            });
        });
    }

    // User settings form submission
    if (userSettingsForm) {
        userSettingsForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Validate form
            if (!validateUserForm()) {
                return false;
            }
            
            // Collect form data
            const formData = {
                first_name: document.getElementById('first_name').value,
                last_name: document.getElementById('last_name').value,
                email: document.getElementById('email').value
            };
            
            // If password field is enabled, include it
            if (!passwordField.disabled && passwordField.value) {
                formData.password = passwordField.value;
            }
            
            // Send data to server
            fetch('/profile/api/user', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // Show success toast
                    const successToast = document.getElementById('successToast');
                    if (successToast) {
                        const toast = bootstrap.Toast.getInstance(successToast) || new bootstrap.Toast(successToast);
                        toast.show();
                    }
                    
                    // Save to localStorage as backup
                    saveUserDataToStorage(formData);
                } else {
                    // Show error message
                    alert('Error: ' + (data.message || 'Failed to update user settings'));
                }
            })
            .catch(error => {
                console.error('Error updating user settings:', error);
                alert('Error updating user settings. Please try again.');
            });
        });
    }
    
    // Business details form submission
    if (businessDetailsForm) {
        businessDetailsForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Validate form
            if (!validateBusinessForm()) {
                return false;
            }
            
            // Collect form data
            const formData = {
                business_name: document.getElementById('business_name').value,
                tagline: document.getElementById('tagline').value,
                business_contact: document.getElementById('business_contact').value,
                business_address: document.getElementById('business_address').value
            };
            
            // Send data to server
            fetch('/profile/api/business', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // Show success toast
                    const businessSuccessToast = document.getElementById('businessSuccessToast');
                    if (businessSuccessToast) {
                        const toast = bootstrap.Toast.getInstance(businessSuccessToast) || new bootstrap.Toast(businessSuccessToast);
                        toast.show();
                    }
                    
                    // Save to localStorage as backup
                    saveBusinessDataToStorage(formData);
                } else {
                    // Show error message
                    alert('Error: ' + (data.message || 'Failed to update business details'));
                }
            })
            .catch(error => {
                console.error('Error updating business details:', error);
                alert('Error updating business details. Please try again.');
            });
        });
    }
    
    // Form validation for user settings
    function validateUserForm() {
        let isValid = true;
        const firstName = document.getElementById('first_name');
        const lastName = document.getElementById('last_name');
        const email = document.getElementById('email');
        
        // Reset validation
        removeValidation(firstName);
        removeValidation(lastName);
        removeValidation(email);
        
        // Validate first name
        if (!firstName.value.trim()) {
            addValidation(firstName, false, 'First name is required');
            isValid = false;
        } else {
            addValidation(firstName, true);
        }
        
        // Validate last name
        if (!lastName.value.trim()) {
            addValidation(lastName, false, 'Last name is required');
            isValid = false;
        } else {
            addValidation(lastName, true);
        }
        
        // Validate email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email.value.trim()) {
            addValidation(email, false, 'Email is required');
            isValid = false;
        } else if (!emailRegex.test(email.value.trim())) {
            addValidation(email, false, 'Please enter a valid email address');
            isValid = false;
        } else {
            addValidation(email, true);
        }
        
        return isValid;
    }
    
    // Form validation for business details
    function validateBusinessForm() {
        let isValid = true;
        const businessName = document.getElementById('business_name');
        const businessContact = document.getElementById('business_contact');
        
        // Reset validation
        removeValidation(businessName);
        removeValidation(businessContact);
        
        // Validate business name
        if (!businessName.value.trim()) {
            addValidation(businessName, false, 'Business name is required');
            isValid = false;
        } else {
            addValidation(businessName, true);
        }
        
        // Validate business contact (simple validation)
        if (businessContact.value.trim() && businessContact.value.trim().length < 7) {
            addValidation(businessContact, false, 'Please enter a valid contact number');
            isValid = false;
        } else if (businessContact.value.trim()) {
            addValidation(businessContact, true);
        }
        
        return isValid;
    }
    
    // Helper functions for form validation
    function addValidation(element, isValid, message = '') {
        const formControl = element.closest('.input-group');
        
        if (isValid) {
            formControl.classList.add('is-valid');
            formControl.classList.remove('is-invalid');
            
            // Remove any existing feedback
            const existingFeedback = formControl.nextElementSibling;
            if (existingFeedback && existingFeedback.classList.contains('invalid-feedback')) {
                existingFeedback.remove();
            }
        } else {
            formControl.classList.add('is-invalid');
            formControl.classList.remove('is-valid');
            
            // Add feedback message
            const existingFeedback = formControl.nextElementSibling;
            if (existingFeedback && existingFeedback.classList.contains('invalid-feedback')) {
                existingFeedback.textContent = message;
            } else {
                const feedback = document.createElement('div');
                feedback.classList.add('invalid-feedback');
                feedback.textContent = message;
                formControl.after(feedback);
            }
        }
    }
    
    function removeValidation(element) {
        const formControl = element.closest('.input-group');
        formControl.classList.remove('is-valid', 'is-invalid');
        
        // Remove any existing feedback
        const existingFeedback = formControl.nextElementSibling;
        if (existingFeedback && existingFeedback.classList.contains('invalid-feedback')) {
            existingFeedback.remove();
        }
    }

    // Load user data from server or localStorage
    function loadUserData() {
        // First try to get data from the server
        fetch('/profile/api/user')
            .then(response => response.json())
            .then(data => {
                if (data.success && data.data) {
                    // Fill form with data from server
                    document.getElementById('first_name').value = data.data.firstName || '';
                    document.getElementById('last_name').value = data.data.lastName || '';
                    document.getElementById('email').value = data.data.email || '';
                    
                    // Fill business data from the same response
                    document.getElementById('business_name').value = data.data.businessName || '';
                    document.getElementById('tagline').value = data.data.tagline || '';
                    document.getElementById('business_contact').value = data.data.contact || '';
                    document.getElementById('business_address').value = data.data.contactAddress || '';
                } else {
                    // If server request fails, try localStorage
                    loadUserDataFromStorage();
                    loadBusinessDataFromStorage();
                }
            })
            .catch(error => {
                console.error('Error loading user data from server:', error);
                // Fallback to localStorage
                loadUserDataFromStorage();
                loadBusinessDataFromStorage();
            });
    }
    
    // Load business data from server or localStorage
    function loadBusinessData() {
        // First try to get data from the server
        fetch('/profile/api/business')
            .then(response => response.json())
            .then(data => {
                if (data.success && data.data) {
                    // Fill form with data from server
                    document.getElementById('business_name').value = data.data.businessName || '';
                    document.getElementById('tagline').value = data.data.tagline || '';
                    document.getElementById('business_contact').value = data.data.contact || '';
                    document.getElementById('business_address').value = data.data.address || '';
                } else {
                    // If server request fails, try localStorage
                    loadBusinessDataFromStorage();
                }
            })
            .catch(error => {
                console.error('Error loading business data from server:', error);
                // Fallback to localStorage
                loadBusinessDataFromStorage();
            });
    }

    // Function to load user data from localStorage
    function loadUserDataFromStorage() {
        try {
            // Load user data
            const userData = JSON.parse(localStorage.getItem('userData')) || {};
            if (userData.firstName) document.getElementById('first_name').value = userData.firstName;
            if (userData.lastName) document.getElementById('last_name').value = userData.lastName;
            if (userData.email) document.getElementById('email').value = userData.email;
        } catch (error) {
            console.error('Error loading user data from localStorage:', error);
        }
    }
    
    // Function to load business data from localStorage
    function loadBusinessDataFromStorage() {
        try {
            // Load business data
            const businessData = JSON.parse(localStorage.getItem('businessData')) || {};
            if (businessData.businessName) document.getElementById('business_name').value = businessData.businessName;
            if (businessData.tagline) document.getElementById('tagline').value = businessData.tagline;
            if (businessData.contact) document.getElementById('business_contact').value = businessData.contact;
            if (businessData.address) document.getElementById('business_address').value = businessData.address;
        } catch (error) {
            console.error('Error loading business data from localStorage:', error);
        }
    }

    // Function to save user data to localStorage
    function saveUserDataToStorage(formData) {
        try {
            // Save user data
            const userData = {
                firstName: formData.first_name,
                lastName: formData.last_name,
                email: formData.email
            };
            localStorage.setItem('userData', JSON.stringify(userData));
        } catch (error) {
            console.error('Error saving user data to localStorage:', error);
        }
    }
    
    // Function to save business data to localStorage
    function saveBusinessDataToStorage(formData) {
        try {
            // Save business data
            const businessData = {
                businessName: formData.business_name,
                tagline: formData.tagline,
                contact: formData.business_contact,
                address: formData.business_address
            };
            localStorage.setItem('businessData', JSON.stringify(businessData));
        } catch (error) {
            console.error('Error saving business data to localStorage:', error);
        }
    }
    
    // Function to change password
    function changePassword(passwordData, modal) {
        // Show a loading message
        const savePasswordBtn = document.getElementById('savePasswordBtn');
        const originalText = savePasswordBtn.innerHTML;
        savePasswordBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i> Processing...';
        savePasswordBtn.disabled = true;
        
        fetch('/profile/api/change-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(passwordData)
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Close the modal
                modal.hide();
                
                // Show success message
                alert('Password changed successfully!');
                
                // Update the password field in the form
                document.getElementById('password').value = '••••••••';
            } else {
                alert('Error changing password: ' + (data.message || 'Unknown error'));
            }
        })
        .catch(error => {
            console.error('Error changing password:', error);
            alert('Error changing password. Please try again.');
        })
        .finally(() => {
            // Restore button state
            savePasswordBtn.innerHTML = originalText;
            savePasswordBtn.disabled = false;
        });
    }
    
    // Handle logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Call logout API
            fetch('/profile/api/logout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // Redirect to login page
                    window.location.href = '/login';
                } else {
                    alert('Error logging out: ' + (data.message || 'Unknown error'));
                }
            })
            .catch(error => {
                console.error('Error logging out:', error);
                // Redirect anyway in case of error
                window.location.href = '/login';
            });
        });
    }

    // Function to update greeting based on time of day
    function updateGreeting() {
        const greetingElement = document.getElementById('greetingText');
        const greetingIconElement = document.getElementById('greetingIcon');
        
        if (greetingElement && greetingIconElement) {
            const hour = new Date().getHours();
            let greeting = '';
            let iconClass = '';
            
            if (hour >= 5 && hour < 12) {
                greeting = 'Good Morning,';
                iconClass = 'fas fa-sun text-warning';
            } else if (hour >= 12 && hour < 17) {
                greeting = 'Good Afternoon,';
                iconClass = 'fas fa-sun text-warning';
            } else if (hour >= 17 && hour < 21) {
                greeting = 'Good Evening,';
                iconClass = 'fas fa-moon text-primary';
            } else {
                greeting = 'Good Night,';
                iconClass = 'fas fa-moon text-primary';
            }
            
            greetingElement.textContent = greeting;
            
            // Update icon
            greetingIconElement.className = iconClass + ' me-2';
        }
    }
    
    // Function to update date display
    function updateDateDisplay() {
        const fullDateElement = document.getElementById('fullDate');
        const shortDateElement = document.getElementById('shortDate');
        
        if (fullDateElement && shortDateElement) {
            const now = new Date();
            const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
            const shortOptions = { month: 'short', day: 'numeric' };
            
            fullDateElement.textContent = now.toLocaleDateString('en-US', options);
            shortDateElement.textContent = now.toLocaleDateString('en-US', shortOptions);
        }
    }
    
    // Function to set up date click handler for calendar popup
    function setupDateClickHandler() {
        const dateContainer = document.getElementById('dateContainer');
        
        if (dateContainer) {
            dateContainer.style.cursor = 'pointer';
            dateContainer.setAttribute('title', 'Click to view calendar');
            
            dateContainer.addEventListener('click', function() {
                // Create a simple calendar modal
                const modalHTML = `
                    <div class="modal fade" id="calendarModal" tabindex="-1" aria-labelledby="calendarModalLabel" aria-hidden="true">
                        <div class="modal-dialog">
                            <div class="modal-content">
                                <div class="modal-header">
                                    <h5 class="modal-title" id="calendarModalLabel">Calendar</h5>
                                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                                </div>
                                <div class="modal-body">
                                    <div id="calendarContainer">
                                        ${generateSimpleCalendar()}
                                    </div>
                                </div>
                                <div class="modal-footer">
                                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
                
                // Add modal to DOM
                const modalContainer = document.createElement('div');
                modalContainer.innerHTML = modalHTML;
                document.body.appendChild(modalContainer);
                
                // Initialize and show the modal
                const calendarModal = new bootstrap.Modal(document.getElementById('calendarModal'));
                calendarModal.show();
                
                // Clean up when modal is hidden
                document.getElementById('calendarModal').addEventListener('hidden.bs.modal', function() {
                    document.body.removeChild(modalContainer);
                });
            });
        }
    }
    
    // Function to generate a simple calendar HTML
    function generateSimpleCalendar() {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        const firstDay = new Date(currentYear, currentMonth, 1).getDay();
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        
        const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        
        let calendarHTML = `
            <div class="d-flex justify-content-between align-items-center mb-3">
                <h4>${monthNames[currentMonth]} ${currentYear}</h4>
            </div>
            <table class="table table-bordered">
                <thead>
                    <tr>
                        <th>Sun</th>
                        <th>Mon</th>
                        <th>Tue</th>
                        <th>Wed</th>
                        <th>Thu</th>
                        <th>Fri</th>
                        <th>Sat</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        let day = 1;
        for (let i = 0; i < 6; i++) {
            calendarHTML += '<tr>';
            
            for (let j = 0; j < 7; j++) {
                if (i === 0 && j < firstDay) {
                    calendarHTML += '<td></td>';
                } else if (day > daysInMonth) {
                    calendarHTML += '<td></td>';
                } else {
                    // Highlight current day
                    const isToday = day === now.getDate();
                    calendarHTML += `<td class="${isToday ? 'bg-primary text-white rounded' : ''}">${day}</td>`;
                    day++;
                }
            }
            
            calendarHTML += '</tr>';
            if (day > daysInMonth) {
                break;
            }
        }
        
        calendarHTML += `
                </tbody>
            </table>
        `;
        
        return calendarHTML;
    }
});
