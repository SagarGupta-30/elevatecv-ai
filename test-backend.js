const http = require('http');

const API_BASE = 'https://elevatecv-ai-e8ku.onrender.com';

async function request(path, options = {}) {
    const url = new URL(path, API_BASE);
    const headers = options.headers || {};
    if (options.body && typeof options.body === 'object') {
        headers['Content-Type'] = 'application/json';
        options.body = JSON.stringify(options.body);
    }
    
    return new Promise((resolve, reject) => {
        const req = http.request(url, {
            method: options.method || 'GET',
            headers
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                let parsed = data;
                try { parsed = JSON.parse(data); } catch (e) {}
                resolve({ status: res.statusCode, headers: res.headers, body: parsed });
            });
        });
        req.on('error', reject);
        if (options.body) req.write(options.body);
        req.end();
    });
}

async function runTests() {
    console.log("=== COMPREHENSIVE E2E & SECURITY BACKEND SUITE ===");

    // Test 1: Health Check
    const health = await request('/');
    console.log("1. Health Check:", health.status === 200 && health.body.success ? "PASS ✅" : "FAIL ❌", health.body);

    // Test 2: Valid Registration
    const userA_email = `userA_${Date.now()}@test.com`;
    const regA = await request('/api/auth/register', {
        method: 'POST',
        body: { name: "User Alpha", email: userA_email, password: "Password123!" }
    });
    console.log("2. Valid Registration User A:", regA.status === 201 && regA.body.data.token ? "PASS ✅" : "FAIL ❌", regA.body);
    const tokenA = regA.body.data ? regA.body.data.token : null;
    const userIdA = regA.body.data ? regA.body.data.user._id : null;

    // Test 3: Duplicate Registration
    const regDup = await request('/api/auth/register', {
        method: 'POST',
        body: { name: "User Alpha Dup", email: userA_email, password: "Password123!" }
    });
    console.log("3. Duplicate Registration:", regDup.status === 409 ? "PASS ✅" : "FAIL ❌", regDup.body);

    // Test 4: Registration Input Validation (short password, invalid email, missing name)
    const regInvalid = await request('/api/auth/register', {
        method: 'POST',
        body: { name: "A", email: "invalid-email", password: "123" }
    });
    console.log("4. Invalid Registration Validation:", regInvalid.status === 400 ? "PASS ✅" : "FAIL ❌", regInvalid.body);

    // Test 5: Valid Login
    const loginA = await request('/api/auth/login', {
        method: 'POST',
        body: { email: userA_email, password: "Password123!" }
    });
    console.log("5. Valid Login:", loginA.status === 200 && loginA.body.data.token ? "PASS ✅" : "FAIL ❌", loginA.body);

    // Test 6: Invalid Login
    const loginBad = await request('/api/auth/login', {
        method: 'POST',
        body: { email: userA_email, password: "WrongPassword" }
    });
    console.log("6. Invalid Login:", loginBad.status === 401 ? "PASS ✅" : "FAIL ❌", loginBad.body);

    // Test 7: Get Profile (/api/auth/me) with token
    const meA = await request('/api/auth/me', {
        headers: { Authorization: `Bearer ${tokenA}` }
    });
    console.log("7. Protected /api/auth/me Profile:", meA.status === 200 && meA.body.data.user.email === userA_email.toLowerCase() ? "PASS ✅" : "FAIL ❌", meA.body);

    // Test 8: Protected /api/auth/me without token / invalid token
    const meNoToken = await request('/api/auth/me');
    console.log("8. Unauthorized Profile Access (No Token):", meNoToken.status === 401 ? "PASS ✅" : "FAIL ❌");
    const meBadToken = await request('/api/auth/me', { headers: { Authorization: "Bearer bad.jwt.token" } });
    console.log("8b. Unauthorized Profile Access (Bad Token):", meBadToken.status === 401 ? "PASS ✅" : "FAIL ❌");

    // Test 9: Create Resume (Full Payload)
    const fullResumeData = {
        personalInformation: {
            fullName: "User Alpha",
            email: userA_email,
            phone: "+1-555-0199",
            location: "San Francisco, CA",
            linkedin: "https://linkedin.com/in/useralpha",
            github: "https://github.com/useralpha",
            portfolio: "https://useralpha.dev"
        },
        summary: "Senior Full Stack Engineer with 8+ years experience building scalable web applications.",
        education: [
            { college: "Stanford University", degree: "B.S.", branch: "Computer Science", cgpa: "3.9", startYear: "2016", endYear: "2020" }
        ],
        skills: ["JavaScript", "Node.js", "Express", "MongoDB", "CSS3", "HTML5"],
        projects: [
            { title: "ElevateCV AI", description: "AI powered resume builder", technologies: "Node, Express, MongoDB", githubLink: "https://github.com/test/project", liveDemo: "https://demo.com" }
        ],
        experience: [
            { company: "Tech Corp", role: "Software Engineer", duration: "2020 - Present", responsibilities: "Architected microservices and REST APIs." }
        ],
        certifications: [
            { name: "AWS Certified Solutions Architect" }
        ],
        achievements: [
            { description: "1st Place Hackathon Winner 2023" }
        ]
    };

    const createRes = await request('/api/resumes', {
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenA}` },
        body: fullResumeData
    });
    console.log("9. Create Full Resume:", createRes.status === 201 && createRes.body.data._id ? "PASS ✅" : "FAIL ❌", createRes.body);
    const resumeIdA = createRes.body.data ? createRes.body.data._id : null;

    // Test 10: Create Resume Validation Failure (Missing Full Name or Education)
    const badResume = await request('/api/resumes', {
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenA}` },
        body: { personalInformation: { email: "test@test.com" } } // missing fullName and education
    });
    console.log("10. Create Resume Validation (Missing Fields):", badResume.status === 400 ? "PASS ✅" : "FAIL ❌", badResume.body);

    // Test 11: Get Resumes for User A
    const listResA = await request('/api/resumes', {
        headers: { Authorization: `Bearer ${tokenA}` }
    });
    console.log("11. Get User Resumes:", listResA.status === 200 && listResA.body.data.length === 1 ? "PASS ✅" : "FAIL ❌", listResA.body);

    // Test 12: Get Specific Resume by ID
    const getResA = await request(`/api/resumes/${resumeIdA}`, {
        headers: { Authorization: `Bearer ${tokenA}` }
    });
    console.log("12. Get Resume By ID:", getResA.status === 200 && getResA.body.data._id === resumeIdA ? "PASS ✅" : "FAIL ❌");

    // Test 13: Update Resume
    const updateRes = await request(`/api/resumes/${resumeIdA}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${tokenA}` },
        body: {
            ...fullResumeData,
            summary: "Updated Professional Summary for User Alpha."
        }
    });
    console.log("13. Update Resume:", updateRes.status === 200 && updateRes.body.data.summary.includes("Updated") ? "PASS ✅" : "FAIL ❌");

    // Test 14: SECURITY — User Isolation (Create User B, attempt User B access to User A's Resume)
    const userB_email = `userB_${Date.now()}@test.com`;
    const regB = await request('/api/auth/register', {
        method: 'POST',
        body: { name: "User Beta", email: userB_email, password: "Password123!" }
    });
    const tokenB = regB.body.data ? regB.body.data.token : null;

    // User B attempts to read User A's resume
    const secGet = await request(`/api/resumes/${resumeIdA}`, {
        headers: { Authorization: `Bearer ${tokenB}` }
    });
    console.log("14. SECURITY User Isolation (User B reads User A's resume):", secGet.status === 404 ? "PASS ✅" : "FAIL ❌ (Allowed access!)", secGet.body);

    // User B attempts to update User A's resume
    const secPut = await request(`/api/resumes/${resumeIdA}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${tokenB}` },
        body: { summary: "Hacked by User B" }
    });
    console.log("15. SECURITY User Isolation (User B updates User A's resume):", secPut.status === 404 || secPut.status === 400 ? "PASS ✅" : "FAIL ❌", secPut.body);

    // User B attempts to delete User A's resume
    const secDel = await request(`/api/resumes/${resumeIdA}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${tokenB}` }
    });
    console.log("16. SECURITY User Isolation (User B deletes User A's resume):", secDel.status === 404 ? "PASS ✅" : "FAIL ❌", secDel.body);

    // Test 17: Delete Resume User A
    const delResA = await request(`/api/resumes/${resumeIdA}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${tokenA}` }
    });
    console.log("17. Delete Resume User A:", delResA.status === 200 ? "PASS ✅" : "FAIL ❌");

    // Verify Deletion
    const getDeleted = await request(`/api/resumes/${resumeIdA}`, {
        headers: { Authorization: `Bearer ${tokenA}` }
    });
    console.log("18. Verify Resume Deletion:", getDeleted.status === 404 ? "PASS ✅" : "FAIL ❌");
}

runTests().catch(console.error);
