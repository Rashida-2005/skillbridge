import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Hash password
  const hashedPassword = await bcrypt.hash('password123', 10);

  // 1. Create Admin User
  const admin = await prisma.user.upsert({
    where: { email: 'admin@skillbridge.com' },
    update: {},
    create: {
      email: 'admin@skillbridge.com',
      password_hash: hashedPassword,
      full_name: 'Admin User',
      role: 'admin',
      bio: 'Platform administrator for SkillBridge',
      skills: ['Management', 'Leadership', 'Project Management'],
    },
  });
  console.log(`✅ Created admin: ${admin.email}`);

  // 2. Create Sample Users (Graduates)
  const user1 = await prisma.user.upsert({
    where: { email: 'john@example.com' },
    update: {},
    create: {
      email: 'john@example.com',
      password_hash: hashedPassword,
      full_name: 'John Doe',
      role: 'graduate',
      bio: 'Recent computer science graduate passionate about web development',
      skills: ['JavaScript', 'React', 'Node.js', 'Python'],
      career_goal: 'Full-stack developer at a tech company',
    },
  });
  console.log(`✅ Created user: ${user1.full_name}`);

  const user2 = await prisma.user.upsert({
    where: { email: 'sarah@example.com' },
    update: {},
    create: {
      email: 'sarah@example.com',
      password_hash: hashedPassword,
      full_name: 'Sarah Smith',
      role: 'graduate',
      bio: 'Data science graduate looking for opportunities in AI/ML',
      skills: ['Python', 'R', 'Machine Learning', 'SQL', 'TensorFlow'],
      career_goal: 'Data Scientist or ML Engineer',
    },
  });
  console.log(`✅ Created user: ${user2.full_name}`);

  const user3 = await prisma.user.upsert({
    where: { email: 'mike@example.com' },
    update: {},
    create: {
      email: 'mike@example.com',
      password_hash: hashedPassword,
      full_name: 'Mike Johnson',
      role: 'graduate',
      bio: 'UI/UX designer and frontend developer',
      skills: ['HTML', 'CSS', 'JavaScript', 'Figma', 'React', 'Tailwind'],
      career_goal: 'Frontend Developer or UI/UX Designer',
    },
  });
  console.log(`✅ Created user: ${user3.full_name}`);

  // 3. Create Sample Mentor
  const mentor = await prisma.user.upsert({
    where: { email: 'mentor@example.com' },
    update: {},
    create: {
      email: 'mentor@example.com',
      password_hash: hashedPassword,
      full_name: 'Dr. Jane Wilson',
      role: 'mentor',
      bio: 'Senior Software Engineer with 10+ years of experience. Passionate about mentoring young developers.',
      skills: ['Java', 'Spring Boot', 'Microservices', 'Cloud Computing', 'AWS'],
      career_goal: 'Help others grow in their careers',
      mentor_profile: {
        create: {
          expertise: ['Full-stack Development', 'Cloud Architecture', 'Career Coaching'],
          availability: 'Weekends and evenings',
          rate: 50,
          bio: 'I help graduates navigate their career paths and build technical skills.',
          years_experience: 10,
        },
      },
    },
  });
  console.log(`✅ Created mentor: ${mentor.full_name}`);

  // 4. Create Sample Courses
  const course1 = await prisma.course.create({
    data: {
      title: 'Complete Web Development Bootcamp',
      description: 'Learn HTML, CSS, JavaScript, React, Node.js, and MongoDB to become a full-stack developer.',
      provider: 'Udemy',
      url: 'https://www.udemy.com/course/web-development-bootcamp/',
      category: 'Full-stack Development',
      level: 'beginner',
      duration: '40 hours',
      thumbnail: 'https://via.placeholder.com/300x200/1a237e/ffffff?text=Web+Dev',
    },
  });
  console.log(`✅ Created course: ${course1.title}`);

  const course2 = await prisma.course.create({
    data: {
      title: 'Machine Learning Specialization',
      description: 'Learn machine learning concepts, algorithms, and applications using Python and TensorFlow.',
      provider: 'Coursera',
      url: 'https://www.coursera.org/specializations/machine-learning',
      category: 'Data Science',
      level: 'intermediate',
      duration: '12 weeks',
      thumbnail: 'https://via.placeholder.com/300x200/00897b/ffffff?text=ML+Specialization',
    },
  });
  console.log(`✅ Created course: ${course2.title}`);

  const course3 = await prisma.course.create({
    data: {
      title: 'NestJS Masterclass',
      description: 'Build scalable server-side applications with NestJS, TypeScript, and Prisma.',
      provider: 'YouTube',
      url: 'https://www.youtube.com/watch?v=GHTA143_b-s',
      category: 'Backend Development',
      level: 'intermediate',
      duration: '15 hours',
      thumbnail: 'https://via.placeholder.com/300x200/e65100/ffffff?text=NestJS',
    },
  });
  console.log(`✅ Created course: ${course3.title}`);

  const course4 = await prisma.course.create({
    data: {
      title: 'UI/UX Design Fundamentals',
      description: 'Learn the principles of user interface and user experience design.',
      provider: 'freeCodeCamp',
      url: 'https://www.freecodecamp.org/learn/ui-ux-design/',
      category: 'Design',
      level: 'beginner',
      duration: '20 hours',
      thumbnail: 'https://via.placeholder.com/300x200/6a1b9a/ffffff?text=UI/UX',
    },
  });
  console.log(`✅ Created course: ${course4.title}`);

  // 5. Enroll Users in Courses
  const enrollment1 = await prisma.userCourse.create({
    data: {
      user_id: user1.id,
      course_id: course1.id,
      status: 'in_progress',
      progress: 45,
      started_at: new Date(),
    },
  });
  console.log(`✅ Enrolled ${user1.full_name} in ${course1.title}`);

  const enrollment2 = await prisma.userCourse.create({
    data: {
      user_id: user1.id,
      course_id: course3.id,
      status: 'not_started',
      progress: 0,
    },
  });
  console.log(`✅ Enrolled ${user1.full_name} in ${course3.title}`);

  const enrollment3 = await prisma.userCourse.create({
    data: {
      user_id: user2.id,
      course_id: course2.id,
      status: 'in_progress',
      progress: 30,
      started_at: new Date(),
    },
  });
  console.log(`✅ Enrolled ${user2.full_name} in ${course2.title}`);

  // 6. Create Sample Jobs
  const job1 = await prisma.job.create({
    data: {
      title: 'Junior Full-Stack Developer',
      company: 'TechCorp Uganda',
      description: 'We are looking for a passionate junior developer to join our team. You will work on web applications using React and Node.js.',
      location: 'Kampala, Uganda',
      type: 'full_time',
      salary_range: 'UGX 2,000,000 - 3,500,000',
      required_skills: ['JavaScript', 'React', 'Node.js', 'PostgreSQL'],
      application_link: 'https://techcorp.ug/jobs/junior-fullstack',
      posted_at: new Date(),
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    },
  });
  console.log(`✅ Created job: ${job1.title}`);

  const job2 = await prisma.job.create({
    data: {
      title: 'Data Science Intern',
      company: 'DataLab Analytics',
      description: 'Internship opportunity for recent graduates interested in data science and machine learning.',
      location: 'Remote',
      type: 'internship',
      salary_range: 'UGX 1,000,000 - 1,500,000',
      required_skills: ['Python', 'SQL', 'Machine Learning', 'Statistics'],
      application_link: 'https://datalab.ug/internships',
      posted_at: new Date(),
      expires_at: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
    },
  });
  console.log(`✅ Created job: ${job2.title}`);

  const job3 = await prisma.job.create({
    data: {
      title: 'Frontend Developer (React)',
      company: 'DesignHub',
      description: 'Looking for a skilled frontend developer with strong React and UI/UX skills.',
      location: 'Kampala, Uganda',
      type: 'full_time',
      salary_range: 'UGX 2,500,000 - 4,000,000',
      required_skills: ['React', 'TypeScript', 'Tailwind CSS', 'Figma'],
      application_link: 'https://designhub.ug/careers',
      posted_at: new Date(),
      expires_at: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
    },
  });
  console.log(`✅ Created job: ${job3.title}`);

  const job4 = await prisma.job.create({
    data: {
      title: 'Freelance WordPress Developer',
      company: 'WebWizards',
      description: 'Short-term freelance project to build a WordPress e-commerce site.',
      location: 'Remote',
      type: 'freelance',
      salary_range: 'UGX 1,000,000 - 2,000,000 (per project)',
      required_skills: ['WordPress', 'PHP', 'WooCommerce', 'CSS'],
      application_link: 'https://webwizards.ug/freelance',
      posted_at: new Date(),
      expires_at: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
    },
  });
  console.log(`✅ Created job: ${job4.title}`);

  // 7. Create Job Applications
  const application1 = await prisma.userJob.create({
    data: {
      user_id: user1.id,
      job_id: job1.id,
      status: 'applied',
      applied_at: new Date(),
      notes: 'I am very excited about this opportunity. I have experience with React and Node.js.',
    },
  });
  console.log(`✅ ${user1.full_name} applied to ${job1.title}`);

  const application2 = await prisma.userJob.create({
    data: {
      user_id: user2.id,
      job_id: job2.id,
      status: 'interviewing',
      applied_at: new Date(),
      notes: 'I have strong Python and ML skills from my coursework.',
    },
  });
  console.log(`✅ ${user2.full_name} applied to ${job2.title}`);

  // 8. Create Sample Assessment
  const assessment = await prisma.assessment.create({
    data: {
      title: 'JavaScript Fundamentals Quiz',
      category: 'JavaScript',
      difficulty: 'easy',
      questions: [
        {
          question: 'What is the output of: console.log(typeof null);',
          options: ['"null"', '"undefined"', '"object"', '"number"'],
          correctAnswer: 2,
        },
        {
          question: 'Which method is used to add an element to the end of an array?',
          options: ['push()', 'pop()', 'shift()', 'unshift()'],
          correctAnswer: 0,
        },
        {
          question: 'What does "DOM" stand for?',
          options: [
            'Document Object Model',
            'Data Object Management',
            'Dynamic Object Model',
            'Document Oriented Model',
          ],
          correctAnswer: 0,
        },
      ],
    },
  });
  console.log(`✅ Created assessment: ${assessment.title}`);

  // 9. Create Assessment Result
  const assessmentResult = await prisma.userAssessment.create({
    data: {
      user_id: user1.id,
      assessment_id: assessment.id,
      score: 2,
      passed: true,
      taken_at: new Date(),
    },
  });
  console.log(`✅ ${user1.full_name} completed ${assessment.title} with score ${assessmentResult.score}/3`);

  console.log('\n🎉 Seeding complete!');
  console.log('📊 Summary:');
  console.log(`   - ${await prisma.user.count()} users created`);
  console.log(`   - ${await prisma.course.count()} courses created`);
  console.log(`   - ${await prisma.job.count()} jobs created`);
  console.log(`   - ${await prisma.userCourse.count()} enrollments created`);
  console.log(`   - ${await prisma.userJob.count()} applications created`);
  console.log('\n🔑 Login credentials:');
  console.log('   Admin: admin@skillbridge.com / password123');
  console.log('   User: john@example.com / password123');
  console.log('   User: sarah@example.com / password123');
  console.log('   User: mike@example.com / password123');
  console.log('   Mentor: mentor@example.com / password123');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
