import { setupHeader } from './utils/header-manager.js';
import { getLocalStorageItem, setLocalStorageItem, getActiveProfile, getLoggedInUser } from './utils/storage-utils.js';

document.addEventListener('DOMContentLoaded', function() {
    setupHeader();

    const elements = {
        feedbackForm: document.getElementById('feedbackForm'),
        feedbackType: document.getElementById('feedbackType'),
        feedbackSubject: document.getElementById('feedbackSubject'),
        feedbackMessage: document.getElementById('feedbackMessage'),
        feedbackRating: document.getElementById('feedbackRating'),
        ratingStars: document.querySelectorAll('.rating-star'),
        feedbackTypeBtns: document.querySelectorAll('.feedback-type-btn'),
        feedbackHistoryList: document.getElementById('feedbackHistoryList')
    };

    function getSafeTranslation(key) {
        return window.getTranslation ? window.getTranslation(key) : key;
    }

    function generateDummyFeedback() {
        const activeProfile = getActiveProfile();
        const loggedInUser = getLoggedInUser();

        if (!activeProfile && !loggedInUser) return [];

        const userTc = activeProfile ? activeProfile.tc : loggedInUser.tc;

        return [
            {
                id: 'FB-001',
                userId: userTc,
                type: 'compliment',
                subject: 'Harika hizmet!',
                message: 'Doktorumuz çok ilgiliydi, teşekkürler.',
                rating: 5,
                status: 'resolved',
                date: '2025-02-10T14:30:00',
                response: 'Geribildiriminiz için teşekkürler!'
            },
            {
                id: 'FB-002',
                userId: userTc,
                type: 'suggestion',
                subject: 'Randevu sistemi önerisi',
                message: 'Randevu saatlerinin daha esnek olmasını istiyorum.',
                rating: 4,
                status: 'pending',
                date: '2025-02-08T10:00:00',
                response: null
            }
        ];
    }

    function renderFeedbackHistory() {
        let feedbacks = getLocalStorageItem('luminexFeedbacks') || [];

        // If no feedbacks exist, generate dummy data
        if (feedbacks.length === 0) {
            feedbacks = generateDummyFeedback();
            setLocalStorageItem('luminexFeedbacks', feedbacks);
        }

        const activeProfile = getActiveProfile();
        const loggedInUser = getLoggedInUser();
        const userTc = activeProfile ? activeProfile.tc : (loggedInUser ? loggedInUser.tc : null);

        // Filter feedbacks for current user
        const userFeedbacks = userTc ? feedbacks.filter(f => f.userId === userTc) : feedbacks;

        if (userFeedbacks.length === 0) {
            elements.feedbackHistoryList.innerHTML = `
                <div class="empty-feedback-state">
                    <i class="fas fa-comment-dots"></i>
                    <p>${getSafeTranslation('noFeedbackHistory')}</p>
                </div>
            `;
            return;
        }

        const currentLang = localStorage.getItem('language') || 'tr';
        const dateLocale = currentLang === 'tr' ? 'tr-TR' : 'en-GB';

        const typeTranslations = {
            'compliment': getSafeTranslation('feedbackTypeCompliment'),
            'complaint': getSafeTranslation('feedbackTypeComplaint'),
            'suggestion': getSafeTranslation('feedbackTypeSuggestion'),
            'question': getSafeTranslation('feedbackTypeQuestion')
        };

        const statusTranslations = {
            'pending': getSafeTranslation('feedbackStatusPending'),
            'resolved': getSafeTranslation('feedbackStatusResolved'),
            'rejected': getSafeTranslation('feedbackStatusRejected')
        };

        elements.feedbackHistoryList.innerHTML = userFeedbacks.sort((a, b) => new Date(b.date) - new Date(a.date)).map(feedback => {
            const date = new Date(feedback.date).toLocaleDateString(dateLocale, {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            });

            const stars = Array(5).fill(0).map((_, i) =>
                `<i class="fas fa-star" style="color: ${i < feedback.rating ? '#ffb800' : '#dfe4ea'}"></i>`
            ).join('');

            return `
                <div class="feedback-item">
                    <div class="feedback-item-header">
                        <span class="feedback-item-type ${feedback.type}">${typeTranslations[feedback.type] || feedback.type}</span>
                        <span class="feedback-item-date">${date}</span>
                    </div>
                    <div class="feedback-item-content">
                        <h4>${feedback.subject}</h4>
                        <p>${feedback.message}</p>
                        ${feedback.response ? `<p style="color: var(--primary-color); font-style: italic;"><strong>Yanıt:</strong> ${feedback.response}</p>` : ''}
                    </div>
                    <div class="feedback-item-footer">
                        <div class="feedback-item-rating">${stars}</div>
                        <span class="feedback-item-status ${feedback.status}">${statusTranslations[feedback.status] || feedback.status}</span>
                    </div>
                </div>
            `;
        }).join('');

        // Re-init reveal animations
        const revealObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) entry.target.classList.add('active');
            });
        }, { threshold: 0.1 });
        document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));
    }

    // Rating stars click handler
    elements.ratingStars.forEach(star => {
        star.addEventListener('click', () => {
            const rating = parseInt(star.dataset.rating);
            elements.feedbackRating.value = rating;

            elements.ratingStars.forEach((s, index) => {
                if (index < rating) {
                    s.classList.add('active');
                } else {
                    s.classList.remove('active');
                }
            });
        });
    });

    // Feedback type buttons click handler
    elements.feedbackTypeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            elements.feedbackTypeBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            elements.feedbackType.value = btn.dataset.type;
        });
    });

    // Form submit handler
    elements.feedbackForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const type = elements.feedbackType.value;
        const subject = elements.feedbackSubject.value;
        const message = elements.feedbackMessage.value;
        const rating = parseInt(elements.feedbackRating.value);

        if (!type) {
            Swal.fire({
                icon: 'warning',
                title: 'Uyarı',
                text: 'Lütfen geri bildirim türünü seçin',
                confirmButtonColor: 'var(--primary-color)'
            });
            return;
        }

        if (!subject.trim() || !message.trim()) {
            Swal.fire({
                icon: 'warning',
                title: 'Uyarı',
                text: 'Lütfen konu ve mesaj alanlarını doldurun',
                confirmButtonColor: 'var(--primary-color)'
            });
            return;
        }

        const activeProfile = getActiveProfile();
        const loggedInUser = getLoggedInUser();
        const userTc = activeProfile ? activeProfile.tc : (loggedInUser ? loggedInUser.tc : null);

        const newFeedback = {
            id: 'FB-' + Date.now(),
            userId: userTc,
            type: type,
            subject: subject,
            message: message,
            rating: rating,
            status: 'pending',
            date: new Date().toISOString(),
            response: null
        };

        let feedbacks = getLocalStorageItem('luminexFeedbacks') || [];
        feedbacks.push(newFeedback);
        setLocalStorageItem('luminexFeedbacks', feedbacks);

        // Reset form
        elements.feedbackForm.reset();
        elements.feedbackType.value = '';
        elements.feedbackRating.value = '5';
        elements.feedbackTypeBtns.forEach(b => b.classList.remove('active'));
        elements.ratingStars.forEach((s, index) => {
            if (index < 5) {
                s.classList.add('active');
            } else {
                s.classList.remove('active');
            }
        });

        Swal.fire({
            icon: 'success',
            title: getSafeTranslation('submitFeedbackSuccess'),
            timer: 2000,
            showConfirmButton: false
        });

        renderFeedbackHistory();
    });

    // Initial render
    renderFeedbackHistory();

    // Reveal animations
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) entry.target.classList.add('active');
        });
    }, { threshold: 0.1 });
    document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));
});
