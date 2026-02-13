export interface Course {
    id: string; // e.g., "CS101"
    title: string;
    credits: number;
    semester: number; // 1-8 (Year 1 Sem 1 = 1, Year 1 Sem 2 = 2, etc.)
    prerequisites: string[]; // List of Course IDs
}

// Mock CS sequence based on a typical US university curriculum
export const COMPUTER_SCIENCE_SEQUENCE: Course[] = [
    // Year 1, Semester 1
    { id: "CS101", title: "Intro to Computer Science", credits: 4, semester: 1, prerequisites: [] },
    { id: "MATH101", title: "Calculus I", credits: 4, semester: 1, prerequisites: [] },
    { id: "ENG101", title: "Composition I", credits: 3, semester: 1, prerequisites: [] },

    // Year 1, Semester 2
    { id: "CS102", title: "Data Structures", credits: 4, semester: 2, prerequisites: ["CS101"] },
    { id: "MATH102", title: "Calculus II", credits: 4, semester: 2, prerequisites: ["MATH101"] },
    { id: "ENG102", title: "Composition II", credits: 3, semester: 2, prerequisites: ["ENG101"] },

    // Year 2, Semester 3 (Fall)
    { id: "CS201", title: "Algorithms", credits: 3, semester: 3, prerequisites: ["CS102", "MATH101"] },
    { id: "CS202", title: "Computer Organization", credits: 3, semester: 3, prerequisites: ["CS101"] },
    { id: "MATH201", title: "Linear Algebra", credits: 3, semester: 3, prerequisites: ["MATH102"] },

    // Year 2, Semester 4 (Spring)
    { id: "CS301", title: "Operating Systems", credits: 3, semester: 4, prerequisites: ["CS201", "CS202"] },
    { id: "CS302", title: "Discrete Structures", credits: 3, semester: 4, prerequisites: ["CS102", "MATH101"] },
    { id: "STAT301", title: "Probability & Statistics", credits: 3, semester: 4, prerequisites: ["MATH102"] },

    // Year 3, Semester 5
    { id: "CS311", title: "Database Systems", credits: 3, semester: 5, prerequisites: ["CS201"] },
    { id: "CS312", title: "Software Engineering", credits: 3, semester: 5, prerequisites: ["CS201"] },

    // Year 3, Semester 6
    { id: "CS321", title: "Programming Languages", credits: 3, semester: 6, prerequisites: ["CS201"] },
    { id: "CS322", title: "Computer Networks", credits: 3, semester: 6, prerequisites: ["CS301"] },

    // Year 4, Semester 7
    { id: "CS401", title: "Senior Project I", credits: 3, semester: 7, prerequisites: ["CS312"] },
    { id: "CS402", title: "Artificial Intelligence", credits: 3, semester: 7, prerequisites: ["CS201", "STAT301"] },

    // Year 4, Semester 8
    { id: "CS403", title: "Senior Project II", credits: 3, semester: 8, prerequisites: ["CS401"] },
];
