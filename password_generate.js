function generatePassword(length) {
    const lowercaseLetters = 'abcdefghijklmnopqrstuvwxyz';
    const uppercaseLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const specialCharacters = '!@#$%&_';

    const allCharacters = lowercaseLetters + uppercaseLetters + numbers + specialCharacters;

    let password = '';
    let hasUppercase = false;
    let hasSpecialChar = false;
    let hasNumber = false;

    // Ensure the first character is an alphabet
    const firstCharIndex = Math.floor(Math.random() * lowercaseLetters.length);
    password += lowercaseLetters[firstCharIndex];

    // Generate random password starting from the second character
    for (let i = 1; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * allCharacters.length);
        const char = allCharacters[randomIndex];

        // Ensure at least one uppercase letter
        if (uppercaseLetters.includes(char)) {
            hasUppercase = true;
        }

        // Ensure at least one special character
        if (specialCharacters.includes(char)) {
            hasSpecialChar = true;
        }

        // Ensure at least one number
        if (numbers.includes(char)) {
            hasNumber = true;
        }

        password += char;
    }

    // Check if the password meets the criteria
    if (!hasUppercase || !hasSpecialChar || !hasNumber || length < 5) {
        // If criteria not met, recursively call the function to generate a new password
        return generatePassword(length);
    }

    return password;
}

// Example usage:
import express from "express";
import { dirname } from "path";
import { fileURLToPath } from "url";
import bodyParser from "body-parser";
import pg from "pg";
import "dotenv/config"

const { PGHOST, PGDATABASE, PGUSER, PGPASSWORD } = process.env;
let islogin = false;
const db = new pg.Client({
  user: PGUSER,
  host: PGHOST,
  database: PGDATABASE,
  password: PGPASSWORD,
  port: 5432,
  ssl:{
    require:true
  }
});
db.connect();
let details = [];

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const port = 3000;
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static('public'));


const newPassword = generatePassword(8); // Generate a password with a length of 8 characters
console.log(newPassword);
const response = await db.query("UPDATE student_info SET password = $1 WHERE studentid = $1",[req.body.rollno])

