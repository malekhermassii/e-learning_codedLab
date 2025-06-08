import figmaCourse from '../assets/images/figma-course.png';
import pythonCourse from '../assets/images/python-course.png';
import guitarCourse from '../assets/images/guitar-course.png';
import flutterCourse from '../assets/images/flutter-course.png';
import ionicCourse from '../assets/images/ionic-course.png';
import sportsCourse from '../assets/images/sports-course.png';
import marketingCourse from '../assets/images/marketing-course.png';
import productCourse from '../assets/images/product-course.png';

export const coursesData = [
  {
    id: 1,
    title: "SEO & Marketing",
    description: "Learn the fundamentals of SEO and digital marketing to grow your business online.",
    instructor: "Mohammed Awad",
    price: 49.99,
    rating: 4.7,
    reviews: 135,
    students: 1240,
    lessons: 30,
    duration: "12 hours",
    level: "Beginner",
    language: "English",
    lastUpdate: "August 2023",
    image: "https://images.unsplash.com/photo-1432888622747-4eb9a8f5a70d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1074&q=80",
    categories: ["Marketing", "Digital", "Business"],
    tags: ["SEO", "Social Media", "Digital Marketing", "Google Analytics"],
    features: [
      "Full lifetime access",
      "Access on mobile and TV",
      "Certificate of completion"
    ]
  },
  {
    id: 2,
    title: "Web Development Bootcamp",
    description: "A comprehensive guide to modern web development, from HTML/CSS to React and Node.js.",
    instructor: "Sarah Johnson",
    price: 79.99,
    rating: 4.9,
    reviews: 256,
    students: 3150,
    lessons: 48,
    duration: "24 hours",
    level: "All Levels",
    language: "English",
    lastUpdate: "October 2023",
    image: "https://images.unsplash.com/photo-1593720213428-28a5b9e94613?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80",
    categories: ["Development", "Web", "Programming"],
    tags: ["HTML", "CSS", "JavaScript", "React", "Node.js"],
    features: [
      "Full lifetime access",
      "Access on mobile and TV",
      "Certificate of completion",
      "Downloadable resources"
    ]
  },
  {
    id: 3,
    title: "Data Science Essentials",
    description: "Master the skills needed to analyze data, build models, and make data-driven decisions.",
    instructor: "David Chen",
    price: 89.99,
    rating: 4.8,
    reviews: 192,
    students: 2160,
    lessons: 36,
    duration: "18 hours",
    level: "Intermediate",
    language: "English",
    lastUpdate: "September 2023",
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80",
    categories: ["Data Science", "Technology", "AI"],
    tags: ["Python", "Machine Learning", "Statistics", "Data Visualization"],
    features: [
      "Full lifetime access",
      "Access on mobile and TV",
      "Certificate of completion",
      "Downloadable datasets"
    ]
  },
  {
    id: 4,
    title: "UI/UX Design Masterclass",
    description: "Create stunning user interfaces and exceptional user experiences for web and mobile applications.",
    instructor: "Emily Rodriguez",
    price: 59.99,
    rating: 4.6,
    reviews: 145,
    students: 1720,
    lessons: 32,
    duration: "16 hours",
    level: "Beginner to Intermediate",
    language: "English",
    lastUpdate: "November 2023",
    image: "https://images.unsplash.com/photo-1618788372246-79faff0c3742?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1074&q=80",
    categories: ["Design", "UI/UX", "Web"],
    tags: ["Figma", "Adobe XD", "Wireframing", "Prototyping"],
    features: [
      "Full lifetime access",
      "Access on mobile and TV",
      "Certificate of completion",
      "Design resources included"
    ]
  },
  {
    id: 5,
    title: "Photography Fundamentals",
    description: "Learn the art and science of photography, from camera basics to advanced composition techniques.",
    instructor: "Michael Thompson",
    price: 39.99,
    rating: 4.5,
    reviews: 112,
    students: 1490,
    lessons: 28,
    duration: "14 hours",
    level: "All Levels",
    language: "English",
    lastUpdate: "July 2023",
    image: "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80",
    categories: ["Photography", "Art", "Creative"],
    tags: ["DSLR", "Composition", "Lighting", "Editing"],
    features: [
      "Full lifetime access",
      "Access on mobile and TV",
      "Certificate of completion"
    ]
  },
  {
    id: 6,
    title: "Financial Planning & Investing",
    description: "Take control of your finances with practical strategies for budgeting, saving, and investing.",
    instructor: "Jessica Williams",
    price: 69.99,
    rating: 4.7,
    reviews: 180,
    students: 2240,
    lessons: 38,
    duration: "20 hours",
    level: "Beginner",
    language: "English",
    lastUpdate: "December 2023",
    image: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80",
    categories: ["Finance", "Business", "Personal Development"],
    tags: ["Investing", "Budgeting", "Stock Market", "Retirement"],
    features: [
      "Full lifetime access",
      "Access on mobile and TV",
      "Certificate of completion",
      "Financial calculators included"
    ]
  },
  {
    id: 7,
    image: figmaCourse,
    title: "Learn Figma - UI/UX Design Essential Training",
    lessons: 6,
    students: 198,
    level: "Beginner",
    rating: 4,
    category: "Design"
  },
  {
    id: 8,
    image: pythonCourse,
    title: "Python For Beginners - Learn Programming",
    lessons: 21,
    students: 99,
    level: "Advanced",
    rating: 3,
    category: "Programming"
  },
  {
    id: 9,
    image: guitarCourse,
    title: "Acoustic Guitar And Electric Guitar Started",
    lessons: 8,
    students: 301,
    level: "Average",
    rating: 5,
    category: "Music"
  },
  {
    id: 10,
    image: flutterCourse,
    title: "Mobile App Development With Flutter & Dart",
    lessons: 15,
    students: 215,
    level: "Beginner",
    rating: 2,
    category: "Programming"
  },
  {
    id: 11,
    image: ionicCourse,
    title: "Ionic React: Mobile Development With Ionic",
    lessons: 15,
    students: 67,
    level: "Advanced",
    rating: 5,
    category: "Programming"
  },
  {
    id: 12,
    image: sportsCourse,
    title: "Sports Management: The Essentials Course",
    lessons: 26,
    students: 156,
    level: "Average",
    rating: 1,
    category: "Business"
  },
  {
    id: 13,
    image: marketingCourse,
    title: "How To Market Yourself As A Consultant",
    lessons: 33,
    students: 64,
    level: "Beginner",
    rating: 3,
    category: "Marketing"
  },
  {
    id: 14,
    image: productCourse,
    title: "Become A Product Manager | Learn The Skills",
    lessons: 5,
    students: 134,
    level: "Advanced",
    rating: 4,
    category: "Business"
  },
  {
    id: 15,
    image: figmaCourse,
    title: "Advanced UI/UX Design Masterclass",
    lessons: 12,
    students: 245,
    level: "Advanced",
    rating: 5,
    category: "Design"
  },
  {
    id: 16,
    image: pythonCourse,
    title: "Python Data Science and Machine Learning",
    lessons: 28,
    students: 189,
    level: "Advanced",
    rating: 4,
    category: "Programming"
  },
  {
    id: 17,
    image: guitarCourse,
    title: "Advanced Guitar Techniques and Music Theory",
    lessons: 15,
    students: 167,
    level: "Advanced",
    rating: 4,
    category: "Music"
  },
  {
    id: 18,
    image: flutterCourse,
    title: "Advanced Flutter State Management",
    lessons: 18,
    students: 143,
    level: "Advanced",
    rating: 5,
    category: "Programming"
  },
  {
    id: 19,
    image: ionicCourse,
    title: "Full-Stack Mobile Development with Ionic",
    lessons: 22,
    students: 98,
    level: "Advanced",
    rating: 4,
    category: "Programming"
  },
  {
    id: 20,
    image: sportsCourse,
    title: "Sports Marketing and Brand Management",
    lessons: 16,
    students: 112,
    level: "Intermediate",
    rating: 4,
    category: "Marketing"
  },
  {
    id: 21,
    image: marketingCourse,
    title: "Digital Marketing Strategy Masterclass",
    lessons: 25,
    students: 178,
    level: "Advanced",
    rating: 5,
    category: "Marketing"
  },
  {
    id: 22,
    image: productCourse,
    title: "Agile Product Management and Development",
    lessons: 20,
    students: 156,
    level: "Intermediate",
    rating: 4,
    category: "Business"
  }
];

export const categories = [
  "All",
  "Programming",
  "Design",
  "Business",
  "Marketing",
  "Music"
]; 