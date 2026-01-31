// js/utils/validation-utils.js

export function validateEmail(email) {
    // A more flexible regex that just checks for the presence of an @ and a . after it.
    const re = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
    return re.test(String(email).toLowerCase());
}

export function validatePassword(password) {
    // Requires at least 8 characters, one uppercase, one lowercase, one number, and one special character
    const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_])[A-Za-z\d\W_]{8,}$/;
    return re.test(password);
}

export function validateTcKimlik(tc) {
    let tcKimlik = String(tc);
    if (!/^[1-9]{1}[0-9]{10}$/.test(tcKimlik)) return false;
    let odd = 0, even = 0, total = 0;
    for (let i = 0; i < 10; i++) {
        let digit = parseInt(tcKimlik[i], 10);
        total += digit;
        if (i < 9) {
            if ((i + 1) % 2 === 1) odd += digit;
            else even += digit;
        }
    }
    if (((odd * 7) - even) % 10 !== parseInt(tcKimlik[9], 10)) return false;
    if (total % 10 !== parseInt(tcKimlik[10], 10)) return false;
    return true;
}

export function validateAge(birthDate) {
    const today = new Date();
    const birthDateObj = new Date(birthDate);
    let age = today.getFullYear() - birthDateObj.getFullYear();
    const m = today.getMonth() - birthDateObj.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDateObj.getDate())) {
        age--;
    }
    return age >= 18;
}
