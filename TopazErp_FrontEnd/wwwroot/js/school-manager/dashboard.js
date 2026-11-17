const app = Vue.createApp({
    data() {
        return {
            current: new Date(new Date().setDate(1)),
            weekdays: ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
            monthNames: [
                'January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December'
            ],
            eventDates: new Set(),

            selectedEvents: [],
            showEventCard: false,
            eventCardStyle: {},
            summaryCards: [
                {
                    title: 'Total Students',
                    value: 0,
                    icon: 'la-user',
                    color: 'linear-gradient(90deg,rgba(2,0,36,1) 0%, rgba(9,9,121,1) 35%, rgba(72,145,240,1))'
                },
                {
                    title: 'Total Teachers',
                    value: 0,
                    icon: 'la-chalkboard-teacher',
                    color: 'linear-gradient(90deg,rgba(72,145,240,1) 0%, rgba(68,68,156,1) 59%, rgba(10,99,112,1) 100%)'
                },
                {
                    title: 'All Classes',
                    value: 0,
                    icon: 'la-school',
                    color: 'linear-gradient(90deg,rgba(2,0,36,1) 0%, rgba(9,9,121,1) 35%, rgba(72,145,240,1))'
                },
                {
                    title: 'All Subjects',
                    value: 0,
                    icon: 'la-book',
                    color: 'linear-gradient(90deg,rgba(72,145,240,1) 0%, rgba(68,68,156,1) 59%, rgba(10,99,112,1) 100%)'
                }
            ],
            selectedClass: '',
            subjects: [],
            assignedSubjects: [],
            classes: [],
            registeredClasses: [],
            students: [],
            teachers: [],
            academicYears: [],
            academicYearId: '',
            termId: '',
            mainClasses: [],
            streams: [],
            terms: [],
            classDropdown: [],
            currentDate: new Date(),
            academicYerTerms: [],
            classLevelPercentages: [],
            allAssignments: [],
            financeDashboard: {
                currencyCode: '',
                billsRaised: 0,
                paymentsReceived: 0,
                outstandingDebt: 0,
                collectionRate: 0,
                todaysCollections: 0,
                monthlyCollections: 0,
            },
            studentDebtors: [],
            events:[],
        }
},

     async mounted() {
         this.loadAllAssignments();
         this.loadAcademicYears();
         await this.loadAcademicYearTerms();
         await this.loadAcademicYearTermEvents();
         await this.loadAssignedSubjects();
         await this.loadStudents();
         await this.loadLevelClasses();
         await this.loadTerms();
         await this.loadClasses();
         await this.loadStreams();  
         await  this.loadSubjects();
         await this.loadTeachers();
         await this.loadClassLevelPercentages();
         await this.loadDropdowns();
         await this.getFinanceDashboard();
         await this.getStudentDebtors();
         
     },
    computed: {
        filteredSubjects() {
            if (!this.selectedClass || !this.termId) return [];

            // Filter assigned subjects for selected class, academic year, and term
            const assignedForClass = this.assignedSubjects
                .filter(
                    s => s.classId === this.selectedClass &&
                        s.academicYearId === this.academicYearId &&
                        s.termId === this.termId
                );

            const subjectsList = [];
            assignedForClass.forEach(asg => {
                asg.details.forEach(detail => {
                    const subject = this.subjects.find(sub => sub.id === detail.subjectId);
                    if (subject) {
                        const studentCount = this.students.filter(
                            st => st.classId === asg.classId && st.academicYearId === this.academicYearId
                        ).length;

                        subjectsList.push({
                            id: detail.id,
                            subjectId: detail.subjectId,
                            name: subject.name,
                            isCore: subject.isCore,
                            isBestSubject: subject.isBestSubject,
                            students: studentCount,
                        });
                    }
                });
            });
            return subjectsList;
        },

        assigned() {
            return this.filteredSubjects.length;
        },
        subjectPerformance() {
            if (!this.selectedClass || !this.termId || !this.academicYearId) return [];

            // Filter assignments for the selected class, term, and academic year
            const assignmentsForClass = this.allAssignments.filter(a =>
                a.classId === this.selectedClass &&
                a.termId === this.termId &&
                a.academicYearId === this.academicYearId &&
                !a.isCanceled
            );

            // Map by subject
            const performance = {};

            assignmentsForClass.forEach(assignment => {
                const subjectId = assignment.subjectId;
                if (!performance[subjectId]) {
                    const subject = this.subjects.find(s => s.id === subjectId);
                    performance[subjectId] = {
                        subjectId,
                        name: subject ? subject.abbreviation : 'Unknown',
                        totalMarks: 0,
                        totalStudents: 0,
                        averageMark: 0,
                        highestMark: 0,
                        lowestMark: null
                    };
                }

                assignment.details.forEach(detail => {
                    const marks = detail.marks || 0;
                    performance[subjectId].totalMarks += marks;
                    performance[subjectId].totalStudents += 1;
                    performance[subjectId].highestMark = Math.max(performance[subjectId].highestMark, marks);
                    performance[subjectId].lowestMark = performance[subjectId].lowestMark === null
                        ? marks
                        : Math.min(performance[subjectId].lowestMark, marks);
                });
            });

            // Calculate average marks
            return Object.values(performance).map(p => {
                p.averageMark = p.totalStudents > 0 ? (p.totalMarks / p.totalStudents).toFixed(2) : 0;
                return p;
            });
        },
        monthTitle() {
            return `${this.monthNames[this.current.getMonth()]} ${this.current.getFullYear()}`;
        },
        calendarCells() {
            const year = this.current.getFullYear();
            const month = this.current.getMonth();
            const firstDay = new Date(year, month, 1).getDay();
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            const daysInPrevMonth = new Date(year, month, 0).getDate();
            const today = new Date();

            const cells = [];

            for (let i = firstDay - 1; i >= 0; i--) {
                cells.push({ day: daysInPrevMonth - i, inMonth: false, isToday: false, hasEvent: false });
            }

            for (let d = 1; d <= daysInMonth; d++) {
                cells.push({
                    day: d,
                    inMonth: true,
                    isToday: d === today.getDate() && month === today.getMonth() && year === today.getFullYear(),
                    hasEvent: this.eventDates.has(`${year}-${month + 1}-${d}`),
                    date: new Date(year, month, d)
                });
            }

            const remaining = (7 - (cells.length % 7)) % 7;
            for (let d = 1; d <= remaining; d++) {
                cells.push({ day: d, inMonth: false, isToday: false, hasEvent: false });
            }

            return cells;
        }
    },
   
    methods: {
        formatMoney(value) {
            return Number(value || 0).toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });
        },
        prevMonth() {
            const d = new Date(this.current);
            d.setMonth(d.getMonth() - 1);
            this.current = d;
            this.$emit('month-change', d);
        },
        nextMonth() {
            const d = new Date(this.current);
            d.setMonth(d.getMonth() + 1);
            this.current = d;
            this.$emit('month-change', d);
        },
        formatDate(date) {
            const d = new Date(date);

            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, "0");
            const day = String(d.getDate()).padStart(2, "0");

            return `${y}-${m}-${day}`;
        },

        showEventPopup(cell, event) {

            if (!cell.inMonth || !cell.hasEvent) {
                this.showEventCard = false;
                return;
            }

            const clicked = new Date(cell.date);
            clicked.setHours(0, 0, 0, 0);

            const clickedTime = clicked.getTime();

            this.selectedEvents = this.events.filter(e => {

                const start = new Date(e.startDate);
                start.setHours(0, 0, 0, 0);

                const end = new Date(e.endDate);
                end.setHours(23, 59, 59, 999);

                return clickedTime >= start.getTime() &&
                    clickedTime <= end.getTime();
            });

            if (!this.selectedEvents.length) {
                this.showEventCard = false;
                return;
            }

            const rect = event.target.getBoundingClientRect();
            

            this.showEventCard = true;
        },

        hideEventPopup() {
            this.showEventCard = false;
        },
        loadAllAssignments() {
            axios.get('/SmReports/GetAllResults', {}).then(res => {
                this.allAssignments = res.data || [];

            });
        },
        loadDropdowns() {
            this.updateSummaryCards();
        },
        async loadAcademicYears() {
            try {
                const response = await axios.get('/SmMainSetups/ListAllAcademicYears');

                this.academicYears = response.data;

                const activeYear = this.academicYears.find(y => y.isActive === true);

                this.academicYearId = activeYear ? activeYear.id : '';

            } catch (error) {
                console.error("Error loading academic years:", error);
            }
        },


        async loadAcademicYearTerms() {
            try {
                const response = await axios.get('/SmMainSetups/ListAllAcademicYearTerms/');

                this.academicYerTerms = response.data;

                const currentTerm = this.academicYerTerms.find(term => {

                    const startDate = new Date(term.startDate);
                    const endDate = new Date(term.endDate);

                    return startDate <= this.currentDate &&
                        this.currentDate <= endDate &&
                        term.academicYearId === this.academicYearId;
                });


                this.termId = currentTerm ? currentTerm.termId : '';

            } catch (error) {
                console.error("Error loading academic year terms:", error);
            }
        },
        async loadAcademicYearTermEvents() {
            try {
                const response = await axios.get('/SmMainSetups/ListAllAcademicYearTermDetails/');

                const currentTerm = this.academicYerTerms.find(term => {

                    const startDate = new Date(term.startDate);
                    const endDate = new Date(term.endDate);

                    return startDate <= this.currentDate &&
                        this.currentDate <= endDate &&
                        term.academicYearId === this.academicYearId;
                });

                this.termId = currentTerm ? currentTerm.termId : '';
                
                this.events = response.data.filter(e => e.academicYearTermId === currentTerm.id);
                // Create dates with events
                this.eventDates.clear();

                this.events.forEach(event => {

                    let current = new Date(event.startDate);
                    const end = new Date(event.endDate);

                    while (current <= end) {

                        this.eventDates.add(
                            `${current.getFullYear()}-${current.getMonth()+1}-${current.getDate()}`
                        );

                        current.setDate(current.getDate() + 1);
                    }

                });

            } catch (error) {
                console.error(error);
            }
        },


        async loadLevelClasses() {
            try {
                const response = await axios.get('/SmMainSetups/ListAllLevelClasses/');
                this.registeredClasses = response.data;

            } catch (error) {
                console.error("Error loading level classes:", error);
            }
        },


        async loadTerms() {
            try {
                const response = await axios.get(`/jsonDataSample/terms.json?v=${new Date().getTime()}`);
                this.terms = response.data;

            } catch (error) {
                console.error("Error loading terms:", error);
            }
        },


        async loadAssignedSubjects() {
            try {
                const response = await axios.get('/SmDataEntry/GetAllAssignedSubjects/');

                this.assignedSubjects = response.data.filter(
                    x => x.academicYearId === this.academicYearId
                );

            } catch (error) {
                console.error("Error loading assigned subjects:", error);
            }
        },


        async loadClasses() {
            try {
                const response = await axios.get('/SmMainSetups/ListAllClasses/');
                this.classes = response.data;

            } catch (error) {
                console.error("Error loading classes:", error);
            }
        },


        async loadStreams() {
            try {
                const response = await axios.get('/SmMainSetups/ListAllStreams/');
                this.streams = response.data;

            } catch (error) {
                console.error("Error loading streams:", error);
            }
        },


        async loadSubjects() {
            try {
                const response = await axios.get('/SmMainSetups/ListAllSubjects/');
                this.subjects = response.data;

            } catch (error) {
                console.error("Error loading subjects:", error);
            }
        },


        async loadStudents() {
            try {
                const response = await axios.get('/SmStudentSetups/ListAllStudents/');

                this.students = response.data.filter(
                    x => x.academicYearId === this.academicYearId
                );

            } catch (error) {
                console.error("Error loading students:", error);
            }
        },


        async loadTeachers() {
            try {
                const response = await axios.get('/SmStaffSetups/ListAllStaffBios/');

                this.teachers = response.data.filter(
                    x => x.isTeacher === true
                );

            } catch (error) {
                console.error("Error loading teachers:", error);
            }
        },


        async loadClassLevelPercentages() {
            try {
                const response = await axios.get('/SmDataEntry/GetAllClassLevelPercentages/');

                this.classLevelPercentages = response.data;

            } catch (error) {
                console.error("Error loading class level percentages:", error);
            }
        },
        getMainClassName(classId) {
            return this.classes.find(c => c.id === classId)?.name || '';
        },
        getStreamName(streamId) {
            return this.streams.find(s => s.id === streamId)?.name || '';
        },
        updateSummaryCards() {
            this.classDropdown = this.registeredClasses.map(c => ({
                id: c.id,
                name: `${this.getMainClassName(c.classId)} ${this.getStreamName(c.streamId)}`.trim()
            }));
            this.classDropdown.sort((a, b) => a.name.localeCompare(b.name));

            // Auto-select first class
            if(this.classDropdown.length > 0) {
                this.selectedClass = this.classDropdown[0].id;
            }

            this.animateValue(0, this.students.length, 0);
            this.animateValue(1, this.teachers.length, 0);
            this.animateValue(2, this.registeredClasses.length, 0);
            this.animateValue(3, this.subjects.length, 0);
        },

        animateValue(index, end, start) {
            let current = start;

            let interval = setInterval(() => {

                current += Math.ceil(end / 20);

                if (current >= end) {
                    current = end;
                    clearInterval(interval);
                }

                this.summaryCards[index].value = current;

            }, 30);
        },

        renderSubjectChart() {
            const ctx = document.getElementById('subjectChart').getContext('2d');

            const labels = this.subjectPerformance.map(s => s.name);
            const avgMarks = this.subjectPerformance.map(s => parseFloat(s.averageMark));
            const highestMarks = this.subjectPerformance.map(s => s.highestMark);
            const lowestMarks = this.subjectPerformance.map(s => s.lowestMark);

            if (this.subjectChart) {
                this.subjectChart.destroy();
            }

            this.subjectChart = new Chart(ctx, {
                type: 'line', // ✅ switch to line chart
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: 'Average Mark',
                            data: avgMarks,
                            borderColor: 'rgb(76 70 255)',
                            backgroundColor: 'rgb(51 85 255 / 0.2)',
                            fill: true,           // fill area under the line
                            tension: 0.4,         // smooth curve
                            pointRadius: 5,
                            pointHoverRadius: 7,
                        },
                        {
                            label: 'Highest Mark',
                            data: highestMarks,
                            borderColor: 'rgb(1 241 219)',
                            backgroundColor: 'rgba(75, 192, 192, 0.2)',
                            fill: true,
                            tension: 0.3,
                            borderDash: [5, 5],   // dashed line
                            pointRadius: 4,
                        },
                        {
                            label: 'Lowest Mark',
                            data: lowestMarks,
                            borderColor: 'rgb(255 15 66)',
                            backgroundColor: 'rgba(255, 99, 132, 0.2)',
                            fill: true,
                            tension: 0.3,
                            borderDash: [5, 5],
                            pointRadius: 4,
                        },
                    ]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            position: 'top',
                        },
                        title: {
                            display: true,
                            text: 'Subject Performance Analysis'
                        },
                        tooltip: {
                            mode: 'index',
                            intersect: false,
                        }
                    },
                    interaction: {
                        mode: 'nearest',
                        axis: 'x',
                        intersect: false
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            max: 100,
                            title: {
                                display: true,
                                text: 'Marks'
                            }
                        },
                        x: {
                            title: {
                                display: true,
                                text: 'Subjects'
                            }
                        }
                    }
                }
            });
        },

        async getFinanceDashboard() {
            try {
                const response = await axios.get('/Dashboard/GetSchFinanceDashboard/');

                this.financeDashboard = response.data;

            } catch (error) {
                console.error("Error loading finance dashboard:", error);

                this.toastHandler(
                    'error',
                    'Unable to load finance dashboard data.'
                );
            }
        },
        getInitials(name) {

            if(!name) return '';

            let parts = name.split(' ');

            return parts.length > 1
                ? parts[0][0] + parts[1][0]
                : parts[0][0];
        },
        async getStudentDebtors() {
            try {
                const response = await axios.get(`/Dashboard/GetStudentDebtors?classId=${this.selectedClass}`);
                this.studentDebtors = response.data;
            } catch (error) {
                console.error("Error loading debtors", error);

                this.toastHandler(
                    'error',
                    'Unable to load debtors'
                );
            }
        },

    },
    watch: {
        selectedClass() {
            this.renderSubjectChart();
            this.getStudentDebtors();
        },
        allAssignments() {
            this.renderSubjectChart();
        },
        termId() {
            this.renderSubjectChart();
        }
    },
});
app.mount('#app');
