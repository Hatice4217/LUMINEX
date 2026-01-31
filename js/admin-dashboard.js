import { setupHeader } from './utils/header-manager.js';
import { getLoggedInUser, getActiveProfile } from './utils/storage-utils.js';

document.addEventListener('DOMContentLoaded', function() {
    setupHeader();

    // Elements
    const elements = {
        welcomeName: document.getElementById('adminWelcomeName'),
        dateDisplay: document.getElementById('adminDateDisplay'),
        totalUsers: document.getElementById('totalUsersCount'),
        totalDoctors: document.getElementById('totalDoctorsCount'),
        todayAppointments: document.getElementById('totalAppointmentsCount'),
        totalHospitals: document.getElementById('totalHospitalsCount')
    };

    // Check Auth and Role
    const activeProfile = getActiveProfile();
    const loggedInUser = getLoggedInUser();

    if (!loggedInUser || loggedInUser.role !== 'admin') {
        window.location.href = 'login.html'; // Redirect non-admin or unauthenticated
        return;
    }

    // Set Welcome Name
    if (elements.welcomeName) {
        elements.welcomeName.textContent = `Hoş Geldiniz, Mustafa Şarlak`;
    }

    // Set Date
    if (elements.dateDisplay) {
        const today = new Date();
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        elements.dateDisplay.textContent = today.toLocaleDateString('tr-TR', options);
    }

    // --- Live Clock Logic ---
    function updateLiveClock() {
        const clockElement = document.querySelector('#liveClock span');
        if (clockElement) {
            const now = new Date();
            clockElement.textContent = now.toLocaleTimeString('tr-TR');
        }
    }
    setInterval(updateLiveClock, 1000);
    updateLiveClock();

    // --- Hardcoded Dummy Data for Stats (Restored to original state) ---
    // In a real app, these would be fetched from the backend or calculated from local storage arrays
    const stats = {
        users: 1542,
        doctors: 128,
        appointments: 64, // Placeholder for today's appointments
        hospitals: 12
    };

    // Populate Stats with animation effect (simple count up)
    function animateValue(obj, start, end, duration) {
        if (!obj) return;
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            obj.innerHTML = Math.floor(progress * (end - start) + start);
            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        };
        window.requestAnimationFrame(step);
    }

    // --- Skeleton Loading Simulation ---
    
    // 1. Apply Skeleton State
    const statElements = [elements.totalUsers, elements.totalDoctors, elements.todayAppointments, elements.totalHospitals];
    statElements.forEach(el => {
        if (el) {
            el.classList.add('skeleton');
            el.innerHTML = '&nbsp;'; // Empty space to maintain height
        }
    });

    // 2. Simulate Data Loading (Delay)
    setTimeout(() => {
        // Remove Skeleton & Start Animation
        statElements.forEach(el => {
            if(el) el.classList.remove('skeleton');
        });

        animateValue(elements.totalUsers, 0, stats.users, 1000);
        animateValue(elements.totalDoctors, 0, stats.doctors, 1200);
        animateValue(elements.todayAppointments, 0, stats.appointments, 800);
        animateValue(elements.totalHospitals, 0, stats.hospitals, 600);

        // --- Chart.js Initialization (Delayed) ---
        const chartCanvas = document.getElementById('activityChart');
        if (chartCanvas) {
            // Ensure canvas has height
            chartCanvas.parentNode.style.height = '300px';
            
            const ctx = chartCanvas.getContext('2d');
            
            // Dynamic Color based on Theme could be added here, but let's stick to a visible brand blue
            const brandColor = '#3667A8';

            new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'],
                    datasets: [{
                        label: 'Randevu Aktivitesi',
                        data: [45, 72, 58, 85, 64, 35, 20],
                        backgroundColor: brandColor,
                        hoverBackgroundColor: '#2A5288',
                        borderRadius: 6,
                        barPercentage: 0.6,
                        categoryPercentage: 0.7
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    animation: {
                        duration: 1500,
                        easing: 'easeOutQuart'
                    },
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            backgroundColor: 'rgba(20, 20, 35, 0.9)',
                            padding: 12,
                            cornerRadius: 8,
                            displayColors: false,
                            titleFont: { size: 13, family: "'Poppins', sans-serif" },
                            bodyFont: { size: 13, family: "'Poppins', sans-serif" },
                            callbacks: {
                                label: function(context) {
                                    return context.raw + ' Randevu';
                                }
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: {
                                color: 'rgba(200, 200, 200, 0.2)',
                                borderDash: [5, 5],
                                drawBorder: false
                            },
                            ticks: {
                                color: '#888',
                                font: { family: "'Poppins', sans-serif" }
                            }
                        },
                        x: {
                            grid: { display: false },
                            ticks: {
                                color: '#888',
                                font: { family: "'Poppins', sans-serif" }
                            }
                        }
                    }
                }
            });
        }
    }, 1200); // 1.2s Loading Delay
});