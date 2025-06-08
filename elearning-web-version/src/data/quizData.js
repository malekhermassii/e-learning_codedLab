/**
 * Quiz data for courses
 * Each course has its own quiz with questions related to its content
 */

export const quizData = {
  // SEO & Marketing Course Quiz
  1: {
    title: "SEO & Marketing Quiz",
    description: "Test your knowledge of SEO and digital marketing fundamentals. You need to score at least 70% to pass.",
    passingScore: 70,
    timeLimit: 15, // minutes
    questions: [
      {
        id: 1,
        question: "What does SEO stand for?",
        options: [
          "Search Engine Optimization",
          "Search Engine Operations",
          "Site Engine Optimization",
          "Search Experience Organization"
        ],
        correctAnswer: 0
      },
      {
        id: 2,
        question: "Which of these is NOT a factor in Google's ranking algorithm?",
        options: [
          "Page loading speed",
          "Mobile-friendliness",
          "Website age",
          "Quality backlinks"
        ],
        correctAnswer: 2
      },
      {
        id: 3,
        question: "What is a meta description?",
        options: [
          "The title of a webpage that appears in search results",
          "A short summary of a webpage that appears in search results",
          "The URL of a webpage",
          "A hidden tag that only search engines can see"
        ],
        correctAnswer: 1
      },
      {
        id: 4,
        question: "What is the purpose of a sitemap?",
        options: [
          "To help search engines discover and index pages on your site",
          "To show visitors how to navigate your website",
          "To track user behavior on your website",
          "To increase website loading speed"
        ],
        correctAnswer: 0
      },
      {
        id: 5,
        question: "What is a backlink?",
        options: [
          "A link that takes users back to the homepage",
          "A link from your website to another website",
          "A link from another website to your website",
          "A broken link that needs fixing"
        ],
        correctAnswer: 2
      },
      {
        id: 6,
        question: "Which of these is an example of black hat SEO?",
        options: [
          "Creating high-quality content",
          "Keyword stuffing",
          "Optimizing page loading speed",
          "Building relationships for natural backlinks"
        ],
        correctAnswer: 1
      },
      {
        id: 7,
        question: "What is the recommended length for a blog post to rank well in search engines?",
        options: [
          "100-300 words",
          "300-600 words",
          "600-1000 words",
          "1000+ words"
        ],
        correctAnswer: 3
      },
      {
        id: 8,
        question: "What is a featured snippet in Google search results?",
        options: [
          "A paid advertisement at the top of search results",
          "A special box that displays an answer to a question directly in search results",
          "A user review of a website",
          "A video result on the search page"
        ],
        correctAnswer: 1
      },
      {
        id: 9,
        question: "What is the purpose of alt text on images?",
        options: [
          "To make images load faster",
          "To improve image quality",
          "To help search engines understand what the image is about",
          "To prevent images from being copied"
        ],
        correctAnswer: 2
      },
      {
        id: 10,
        question: "Which of the following is NOT a good practice for local SEO?",
        options: [
          "Creating a Google My Business listing",
          "Getting reviews from customers",
          "Using the same content across multiple location pages",
          "Including local keywords in your content"
        ],
        correctAnswer: 2
      }
    ]
  },
  
  // Web Development Bootcamp Quiz
  2: {
    title: "Web Development Quiz",
    description: "Test your knowledge of web development concepts. You need to score at least 70% to pass.",
    passingScore: 70,
    timeLimit: 15, // minutes
    questions: [
      {
        id: 1,
        question: "What does HTML stand for?",
        options: [
          "Hyper Text Markup Language",
          "High Tech Machine Learning",
          "Hyper Transfer Markup Language",
          "Hyperlink Text Management Language"
        ],
        correctAnswer: 0
      },
      {
        id: 2,
        question: "Which CSS property is used to change the text color of an element?",
        options: [
          "text-color",
          "font-color",
          "color",
          "text-style"
        ],
        correctAnswer: 2
      },
      {
        id: 3,
        question: "What is the correct way to create a JavaScript array?",
        options: [
          "var colors = (1:'red', 2:'green', 3:'blue')",
          "var colors = ['red', 'green', 'blue']",
          "var colors = 'red', 'green', 'blue'",
          "var colors = {red, green, blue}"
        ],
        correctAnswer: 1
      },
      {
        id: 4,
        question: "Which HTML tag is used to define an internal style sheet?",
        options: [
          "<css>",
          "<script>",
          "<style>",
          "<stylesheet>"
        ],
        correctAnswer: 2
      },
      {
        id: 5,
        question: "What is the correct way to write a JavaScript function?",
        options: [
          "function = myFunction()",
          "function:myFunction()",
          "function myFunction()",
          "myFunction() = function"
        ],
        correctAnswer: 2
      },
      {
        id: 6,
        question: "What is the purpose of the useState hook in React?",
        options: [
          "To create global state management",
          "To manage component state in functional components",
          "To declare static variables",
          "To initialize the React application"
        ],
        correctAnswer: 1
      },
      {
        id: 7,
        question: "What is the box model in CSS?",
        options: [
          "A framework for creating modal dialogs",
          "A layout algorithm for arranging elements in rows and columns",
          "A conceptual model that describes content, padding, border, and margin areas",
          "A JavaScript library for animations"
        ],
        correctAnswer: 2
      },
      {
        id: 8,
        question: "Which of the following is NOT a JavaScript framework or library?",
        options: [
          "Angular",
          "React",
          "Vue",
          "Scala"
        ],
        correctAnswer: 3
      },
      {
        id: 9,
        question: "What is the purpose of responsive web design?",
        options: [
          "To make websites load faster",
          "To optimize websites for search engines",
          "To ensure websites work well on all devices and screen sizes",
          "To add more interactive features to websites"
        ],
        correctAnswer: 2
      },
      {
        id: 10,
        question: "Which HTTP method is used to request data from a server?",
        options: [
          "GET",
          "POST",
          "PUT",
          "DELETE"
        ],
        correctAnswer: 0
      }
    ]
  },
  
  // Data Science Essentials Quiz
  3: {
    title: "Data Science Quiz",
    description: "Test your knowledge of data science concepts. You need to score at least 70% to pass.",
    passingScore: 70,
    timeLimit: 15, // minutes
    questions: [
      {
        id: 1,
        question: "Which of the following is NOT a common Python library used in data science?",
        options: [
          "NumPy",
          "Pandas",
          "Flask",
          "Matplotlib"
        ],
        correctAnswer: 2
      },
      {
        id: 2,
        question: "What does the term 'overfitting' refer to in machine learning?",
        options: [
          "When a model performs well on training data but poorly on new data",
          "When a model is too simple to capture patterns in the data",
          "When a model takes too long to train",
          "When a dataset is too large to process efficiently"
        ],
        correctAnswer: 0
      },
      {
        id: 3,
        question: "What is the purpose of the 'groupby' function in Pandas?",
        options: [
          "To sort data alphabetically",
          "To split data into groups based on criteria and perform operations on each group",
          "To join multiple dataframes together",
          "To remove duplicate values from a dataset"
        ],
        correctAnswer: 1
      },
      {
        id: 4,
        question: "Which of these is an example of unsupervised learning?",
        options: [
          "Linear regression",
          "Random forest classification",
          "K-means clustering",
          "Support vector machines"
        ],
        correctAnswer: 2
      },
      {
        id: 5,
        question: "What is the purpose of cross-validation in machine learning?",
        options: [
          "To check if the model works with different programming languages",
          "To evaluate how well a model generalizes to independent data",
          "To compare different visualization techniques",
          "To speed up the model training process"
        ],
        correctAnswer: 1
      },
      {
        id: 6,
        question: "What is the difference between correlation and causation?",
        options: [
          "They are the same thing",
          "Correlation measures the strength of a relationship, causation implies one variable causes a change in another",
          "Correlation is used in statistics, causation is used in machine learning",
          "Correlation is always stronger than causation"
        ],
        correctAnswer: 1
      },
      {
        id: 7,
        question: "What does the term 'outlier' refer to in statistics?",
        options: [
          "The most common value in a dataset",
          "The mean value of a dataset",
          "A data point that differs significantly from other observations",
          "The range between the highest and lowest values"
        ],
        correctAnswer: 2
      },
      {
        id: 8,
        question: "Which of the following is a type of data visualization?",
        options: [
          "SQL query",
          "Scatter plot",
          "JSON format",
          "API endpoint"
        ],
        correctAnswer: 1
      },
      {
        id: 9,
        question: "What is feature engineering in machine learning?",
        options: [
          "The process of building new machine learning algorithms",
          "The process of creating, selecting, and transforming variables for a model",
          "The process of testing different models simultaneously",
          "The process of optimizing model performance on a GPU"
        ],
        correctAnswer: 1
      },
      {
        id: 10,
        question: "What is the purpose of A/B testing?",
        options: [
          "To compare two versions of something to determine which performs better",
          "To test if a dataset follows a normal distribution",
          "To check if a model is overfitting",
          "To validate if two datasets have the same features"
        ],
        correctAnswer: 0
      }
    ]
  }
}; 