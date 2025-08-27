// Global Variables
let employees = [];
let attendanceData = {};
let currentEmployee = null;

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    updateTime();
    setInterval(updateTime, 1000);
});

// Initialize application
function initializeApp() {
    loadEmployees();
    loadAttendanceData();
    setupEventListeners();
    updateSummaryStats();
    renderEmployeeList();
    setTodayDate();
}

// Update current time
function updateTime() {
    const now = new Date();
    const timeString = now.toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    document.getElementById('time-display').textContent = timeString;
}

// Setup event listeners
function setupEventListeners() {
    // Employee ID input
    const employeeIdInput = document.getElementById('employee-id');
    employeeIdInput.addEventListener('input', function() {
        const employeeId = this.value.trim();
        if (employeeId.length === 6) {
            findEmployee(employeeId);
        } else {
            clearEmployeeInfo();
        }
    });

    // Add employee form
    const addEmployeeForm = document.getElementById('add-employee-form');
    addEmployeeForm.addEventListener('submit', function(e) {
        e.preventDefault();
        addNewEmployee();
    });

    // Modal close on outside click
    const modal = document.getElementById('add-employee-modal');
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeAddEmployeeModal();
        }
    });
}

// Set today's date in date picker
function setTodayDate() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('attendance-date').value = today;
    
    // Set current month in salary month picker
    const currentMonth = new Date().toISOString().slice(0, 7);
    document.getElementById('salary-month').value = currentMonth;
}

// Find employee by ID
function findEmployee(employeeId) {
    const employee = employees.find(emp => emp.id === employeeId);
    if (employee) {
        currentEmployee = employee;
        document.getElementById('employee-name').value = employee.name;
        showNotification('تم العثور على الموظف: ' + employee.name, 'success');
    } else {
        clearEmployeeInfo();
        showNotification('لم يتم العثور على موظف بهذا الرقم', 'error');
    }
}

// Clear employee information
function clearEmployeeInfo() {
    currentEmployee = null;
    document.getElementById('employee-name').value = '';
}

// Check in function
function checkIn() {
    if (!currentEmployee) {
        showNotification('يرجى إدخال رقم موظف صحيح', 'error');
        return;
    }

    const today = new Date().toISOString().split('T')[0];
    const currentTime = new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
    });

    // Check if already checked in today
    if (attendanceData[today] && attendanceData[today][currentEmployee.id]) {
        if (attendanceData[today][currentEmployee.id].checkIn) {
            showNotification('تم تسجيل الحضور مسبقاً لهذا اليوم', 'warning');
            return;
        }
    }

    // Initialize attendance data for today if not exists
    if (!attendanceData[today]) {
        attendanceData[today] = {};
    }

    // Check if late
    const workStartTime = currentEmployee.workStartTime;
    const currentTimeObj = new Date();
    const workStartTimeObj = new Date();
    const [startHour, startMinute] = workStartTime.split(':');
    workStartTimeObj.setHours(parseInt(startHour), parseInt(startMinute), 0);

    const isLate = currentTimeObj > workStartTimeObj;

    // Save check-in data
    attendanceData[today][currentEmployee.id] = {
        checkIn: currentTime,
        checkOut: null,
        isLate: isLate,
        employeeName: currentEmployee.name
    };

    saveAttendanceData();
    updateSummaryStats();
    loadAttendanceData();
    
    const status = isLate ? 'متأخر' : 'في الوقت المحدد';
    showNotification(`تم تسجيل الحضور بنجاح - ${status}`, 'success');
    
    // Clear form
    document.getElementById('employee-id').value = '';
    clearEmployeeInfo();
}

// Check out function
function checkOut() {
    if (!currentEmployee) {
        showNotification('يرجى إدخال رقم موظف صحيح', 'error');
        return;
    }

    const today = new Date().toISOString().split('T')[0];
    const currentTime = new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
    });

    // Check if checked in today
    if (!attendanceData[today] || !attendanceData[today][currentEmployee.id] || !attendanceData[today][currentEmployee.id].checkIn) {
        showNotification('لم يتم تسجيل الحضور لهذا اليوم', 'error');
        return;
    }

    // Check if already checked out
    if (attendanceData[today][currentEmployee.id].checkOut) {
        showNotification('تم تسجيل الانصراف مسبقاً لهذا اليوم', 'warning');
        return;
    }

    // Save check-out data
    attendanceData[today][currentEmployee.id].checkOut = currentTime;

    saveAttendanceData();
    updateSummaryStats();
    loadAttendanceData();
    
    showNotification('تم تسجيل الانصراف بنجاح', 'success');
    
    // Clear form
    document.getElementById('employee-id').value = '';
    clearEmployeeInfo();
}

// Add new employee
function addNewEmployee() {
    const employeeId = document.getElementById('new-employee-id').value.trim();
    const employeeName = document.getElementById('new-employee-name').value.trim();
    const position = document.getElementById('new-employee-position').value.trim();
    const salary = document.getElementById('new-employee-salary').value;
    const workStartTime = document.getElementById('work-start-time').value;
    const workEndTime = document.getElementById('work-end-time').value;

    // Validation
    if (!employeeId || !employeeName || !position || !salary || !workStartTime || !workEndTime) {
        showNotification('يرجى ملء جميع الحقول المطلوبة', 'error');
        return;
    }

    if (employeeId.length !== 6) {
        showNotification('رقم الموظف يجب أن يكون 6 أرقام', 'error');
        return;
    }

    // Check if employee ID already exists
    if (employees.find(emp => emp.id === employeeId)) {
        showNotification('رقم الموظف موجود مسبقاً', 'error');
        return;
    }

    // Create new employee
    const newEmployee = {
        id: employeeId,
        name: employeeName,
        position: position,
        salary: parseFloat(salary),
        workStartTime: workStartTime,
        workEndTime: workEndTime,
        joinDate: new Date().toISOString().split('T')[0]
    };

    employees.push(newEmployee);
    saveEmployees();
    renderEmployeeList();
    updateSummaryStats();
    
    showNotification('تم إضافة الموظف بنجاح', 'success');
    closeAddEmployeeModal();
    
    // Clear form
    document.getElementById('add-employee-form').reset();
}

// Show add employee modal
function showAddEmployeeModal() {
    document.getElementById('add-employee-modal').classList.add('active');
}

// Close add employee modal
function closeAddEmployeeModal() {
    document.getElementById('add-employee-modal').classList.remove('active');
}

// Render employee list
function renderEmployeeList() {
    const employeeList = document.getElementById('employee-list');
    employeeList.innerHTML = '';

    employees.forEach(employee => {
        const employeeItem = document.createElement('div');
        employeeItem.className = 'employee-item';
        employeeItem.innerHTML = `
            <div class="employee-header">
                <span class="employee-name">${employee.name}</span>
                <span class="employee-id">${employee.id}</span>
            </div>
            <div class="employee-details">
                <p><strong>المنصب:</strong> ${employee.position}</p>
                <p><strong>الراتب:</strong> ${employee.salary} ريال</p>
                <p><strong>وقت العمل:</strong> ${employee.workStartTime} - ${employee.workEndTime}</p>
            </div>
        `;
        employeeList.appendChild(employeeItem);
    });
}

// Load attendance data for selected date
function loadAttendanceData() {
    const selectedDate = document.getElementById('attendance-date').value;
    const tbody = document.getElementById('attendance-tbody');
    tbody.innerHTML = '';

    if (!attendanceData[selectedDate]) {
        return;
    }

    employees.forEach(employee => {
        const attendance = attendanceData[selectedDate][employee.id];
        const row = document.createElement('tr');
        
        let checkInTime = '-';
        let checkOutTime = '-';
        let workHours = '-';
        let status = 'غائب';
        let statusClass = 'status-absent';

        if (attendance) {
            checkInTime = attendance.checkIn || '-';
            checkOutTime = attendance.checkOut || '-';
            
            if (attendance.checkIn) {
                if (attendance.isLate) {
                    status = 'متأخر';
                    statusClass = 'status-late';
                } else {
                    status = 'حاضر';
                    statusClass = 'status-present';
                }
            }

            // Calculate work hours
            if (attendance.checkIn && attendance.checkOut) {
                const checkInTime = new Date(`2000-01-01 ${attendance.checkIn}`);
                const checkOutTime = new Date(`2000-01-01 ${attendance.checkOut}`);
                const hours = (checkOutTime - checkInTime) / (1000 * 60 * 60);
                workHours = hours.toFixed(2) + ' ساعة';
            }
        }

        row.innerHTML = `
            <td>${employee.id}</td>
            <td>${employee.name}</td>
            <td>${checkInTime}</td>
            <td>${checkOutTime}</td>
            <td>${workHours}</td>
            <td class="${statusClass}">${status}</td>
        `;
        tbody.appendChild(row);
    });
}

// Update summary statistics
function updateSummaryStats() {
    const today = new Date().toISOString().split('T')[0];
    
    document.getElementById('total-employees').textContent = employees.length;
    
    let presentCount = 0;
    let absentCount = 0;
    let lateCount = 0;

    if (attendanceData[today]) {
        employees.forEach(employee => {
            const attendance = attendanceData[today][employee.id];
            if (attendance && attendance.checkIn) {
                presentCount++;
                if (attendance.isLate) {
                    lateCount++;
                }
            } else {
                absentCount++;
            }
        });
    } else {
        absentCount = employees.length;
    }

    document.getElementById('present-employees').textContent = presentCount;
    document.getElementById('absent-employees').textContent = absentCount;
    document.getElementById('late-employees').textContent = lateCount;
}

// Export attendance data
function exportAttendance() {
    const selectedDate = document.getElementById('attendance-date').value;
    const data = [];
    
    // Add header
    data.push(['رقم الموظف', 'اسم الموظف', 'وقت الحضور', 'وقت الانصراف', 'ساعات العمل', 'الحالة']);
    
    // Add data
    employees.forEach(employee => {
        const attendance = attendanceData[selectedDate] ? attendanceData[selectedDate][employee.id] : null;
        
        let checkInTime = '-';
        let checkOutTime = '-';
        let workHours = '-';
        let status = 'غائب';

        if (attendance) {
            checkInTime = attendance.checkIn || '-';
            checkOutTime = attendance.checkOut || '-';
            
            if (attendance.checkIn) {
                if (attendance.isLate) {
                    status = 'متأخر';
                } else {
                    status = 'حاضر';
                }
            }

            if (attendance.checkIn && attendance.checkOut) {
                const checkInTime = new Date(`2000-01-01 ${attendance.checkIn}`);
                const checkOutTime = new Date(`2000-01-01 ${attendance.checkOut}`);
                const hours = (checkOutTime - checkInTime) / (1000 * 60 * 60);
                workHours = hours.toFixed(2) + ' ساعة';
            }
        }

        data.push([employee.id, employee.name, checkInTime, checkOutTime, workHours, status]);
    });

    // Convert to CSV
    const csvContent = data.map(row => row.join(',')).join('\n');
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `attendance_${selectedDate}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showNotification('تم تصدير البيانات بنجاح', 'success');
}

// Show notification
function showNotification(message, type = 'info') {
    const container = document.getElementById('notification-container');
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    container.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 5000);
}

// Salary Calculation Functions
function calculateSalaries() {
    const selectedMonth = document.getElementById('salary-month').value;
    if (!selectedMonth) {
        showNotification('يرجى اختيار الشهر', 'error');
        return;
    }

    const [year, month] = selectedMonth.split('-');
    const tbody = document.getElementById('salary-tbody');
    tbody.innerHTML = '';

    let totalSalaries = 0;
    let totalDeductions = 0;

    employees.forEach(employee => {
        const salaryData = calculateEmployeeSalary(employee, year, month);
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${employee.id}</td>
            <td>${employee.name}</td>
            <td>${salaryData.baseSalary.toFixed(2)} ريال</td>
            <td>${salaryData.presentDays}</td>
            <td>${salaryData.absentDays}</td>
            <td>${salaryData.lateDays}</td>
            <td>${salaryData.totalHours.toFixed(2)} ساعة</td>
            <td>${salaryData.deductions.toFixed(2)} ريال</td>
            <td>${salaryData.finalSalary.toFixed(2)} ريال</td>
        `;
        tbody.appendChild(row);

        totalSalaries += salaryData.baseSalary;
        totalDeductions += salaryData.deductions;
    });

    const netSalaries = totalSalaries - totalDeductions;

    document.getElementById('total-salaries').textContent = totalSalaries.toFixed(2) + ' ريال';
    document.getElementById('total-deductions').textContent = totalDeductions.toFixed(2) + ' ريال';
    document.getElementById('net-salaries').textContent = netSalaries.toFixed(2) + ' ريال';

    showNotification('تم حساب الرواتب بنجاح', 'success');
}

function calculateEmployeeSalary(employee, year, month) {
    const baseSalary = employee.salary;
    let presentDays = 0;
    let absentDays = 0;
    let lateDays = 0;
    let totalHours = 0;

    // Get all days in the selected month
    const daysInMonth = new Date(year, month, 0).getDate();
    
    for (let day = 1; day <= daysInMonth; day++) {
        const date = `${year}-${month.padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
        const attendance = attendanceData[date] ? attendanceData[date][employee.id] : null;

        if (attendance && attendance.checkIn) {
            presentDays++;
            if (attendance.isLate) {
                lateDays++;
            }

            // Calculate work hours
            if (attendance.checkIn && attendance.checkOut) {
                const checkInTime = new Date(`2000-01-01 ${attendance.checkIn}`);
                const checkOutTime = new Date(`2000-01-01 ${attendance.checkOut}`);
                const hours = (checkOutTime - checkInTime) / (1000 * 60 * 60);
                totalHours += hours;
            }
        } else {
            // Check if it's a working day (Sunday to Thursday)
            const dayOfWeek = new Date(date).getDay();
            if (dayOfWeek >= 0 && dayOfWeek <= 4) { // Sunday = 0, Thursday = 4
                absentDays++;
            }
        }
    }

    // Calculate deductions
    const dailySalary = baseSalary / 30; // Assuming 30 days per month
    const absentDeduction = absentDays * dailySalary;
    const lateDeduction = lateDays * (dailySalary * 0.1); // 10% deduction for each late day
    const totalDeductions = absentDeduction + lateDeduction;

    const finalSalary = baseSalary - totalDeductions;

    return {
        baseSalary,
        presentDays,
        absentDays,
        lateDays,
        totalHours,
        deductions: totalDeductions,
        finalSalary
    };
}

function exportSalaryReport() {
    const selectedMonth = document.getElementById('salary-month').value;
    if (!selectedMonth) {
        showNotification('يرجى اختيار الشهر أولاً', 'error');
        return;
    }

    const [year, month] = selectedMonth.split('-');
    const data = [];
    
    // Add header
    data.push(['رقم الموظف', 'اسم الموظف', 'الراتب الأساسي', 'أيام الحضور', 'أيام الغياب', 'أيام التأخير', 'ساعات العمل الإجمالية', 'الخصومات', 'الراتب النهائي']);
    
    // Add data
    employees.forEach(employee => {
        const salaryData = calculateEmployeeSalary(employee, year, month);
        data.push([
            employee.id,
            employee.name,
            salaryData.baseSalary.toFixed(2) + ' ريال',
            salaryData.presentDays,
            salaryData.absentDays,
            salaryData.lateDays,
            salaryData.totalHours.toFixed(2) + ' ساعة',
            salaryData.deductions.toFixed(2) + ' ريال',
            salaryData.finalSalary.toFixed(2) + ' ريال'
        ]);
    });

    // Convert to CSV
    const csvContent = data.map(row => row.join(',')).join('\n');
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `salary_report_${selectedMonth}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showNotification('تم تصدير تقرير الرواتب بنجاح', 'success');
}

// Local Storage Functions
function saveEmployees() {
    localStorage.setItem('attendance_employees', JSON.stringify(employees));
}

function loadEmployees() {
    const saved = localStorage.getItem('attendance_employees');
    if (saved) {
        employees = JSON.parse(saved);
    } else {
        // Add some sample employees
        employees = [
            {
                id: '100001',
                name: 'أحمد محمد',
                position: 'مدير',
                salary: 5000,
                workStartTime: '08:00',
                workEndTime: '17:00',
                joinDate: '2024-01-01'
            },
            {
                id: '100002',
                name: 'فاطمة علي',
                position: 'نادل',
                salary: 3000,
                workStartTime: '09:00',
                workEndTime: '18:00',
                joinDate: '2024-01-15'
            },
            {
                id: '100003',
                name: 'محمد حسن',
                position: 'طباخ',
                salary: 3500,
                workStartTime: '07:00',
                workEndTime: '16:00',
                joinDate: '2024-02-01'
            }
        ];
        saveEmployees();
    }
}

function saveAttendanceData() {
    localStorage.setItem('attendance_data', JSON.stringify(attendanceData));
}

function loadAttendanceData() {
    const saved = localStorage.getItem('attendance_data');
    if (saved) {
        attendanceData = JSON.parse(saved);
    }
}
