<template>
  <div class="app">
    <header>
      <h1>Bonjour Anne</h1>
      <h2>Colle les URLS des articles à convertir en PDF</h2>
      <img src="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD..." alt="Placeholder Image" style="margin: 20px 0; border-radius: 10px;">
    </header>
    
    <main>
      <!-- Form for submitting URLs to convert to PDFs -->
      <form @submit.prevent="requestScreenshots">
        <textarea v-model="urls" placeholder="Colle les URLs, un par ligne"></textarea>
        <input type="submit" value="Convertir URLs en PDF"/>
      </form>
      
      <div v-if="screenshotUrls.length > 0">
        <h2>Download Links</h2>
        <ul>
          <li v-for="(url, index) in screenshotUrls" :key="index">
            <a :href="url" target="_blank" download>Download PDF {{ index + 1 }}</a>
          </li>
        </ul>
      </div>
    </main>
  </div>
</template>

<script>
import { ref } from "vue";

export default {
  name: 'App',
  setup() {
    const urls = ref("");  // A string with URLs separated by newlines
    const screenshotUrls = ref([]); // List of URLs for downloading PDFs

    const requestScreenshots = async () => {
      const urlList = urls.value.split('\n').map(url => url.trim()).filter(Boolean); // Convert string to array of URLs
      screenshotUrls.value = []; // Reset the list of URLs

      for (let url of urlList) {
        console.log("Requesting screenshot for", url);
        const res = await fetch("http://localhost:5000/screenshot", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ url }),
        });

        const pdfBuffer = await res.blob(); // Get the PDF file as a Blob
        console.log("Received PDF", res);

        // if (res.ok) {
        //   // Create a URL for the Blob (which will be used as the href for the link)
        //   const pdfUrl = URL.createObjectURL(pdfBuffer);

        //   // Add the PDF link to the screenshotUrls array
        //   screenshotUrls.value.push(pdfUrl);
          
        // }

        if (res.ok) {
          // Create a link to download the PDF from the Blob
          const link = document.createElement("a");
          link.href = URL.createObjectURL(pdfBuffer); // Create an object URL for the Blob
          link.download = `${url.pathname}.pdf`; // Set the filename for the download
          link.click(); // Trigger the download
        }
      }
    };

    return { urls, screenshotUrls, requestScreenshots };
  }
}
</script>


<style>
/* Body Background */
body {
  font-family: 'Lucida Sans', 'Lucida Sans Regular', 'Lucida Grande', 'Lucida Sans Unicode', Geneva, Verdana, sans-serif;
  margin: 0;
  padding: 0;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
}

/* Main App Layout */
.app {
  background: rgba(255, 255, 255, 0.8); /* White background with opacity */
  border-radius: 15px;
  padding: 30px;
  width: 100%;
  max-width: 500px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  text-align: center;
}

/* Header */
header h1 {
  font-size: 2rem;
  font-weight: 600;
  margin-bottom: 20px;
  color: #333;
  animation: fadeIn 3s ease-in-out;
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(-20px);
    }
    to {
      opacity: 2;
      transform: translateY(0);
    }
  }
}

/* Form Styling */
form {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

/* Textarea */
textarea {
  font-size: 1rem;
  padding: 10px;
  border-radius: 8px;
  border: 1px solid #ddd;
  min-height: 150px;
  resize: vertical;
  outline: none;
  transition: border-color 0.3s;
}

textarea:focus {
  border-color: #007BFF;
}

/* Submit Button */
input[type="submit"] {
  padding: 10px 20px;
  background-color: #007BFF;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  transition: background-color 0.3s;
}

input[type="submit"]:hover {
  background-color: #0056b3;
}

/* Responsive Design */
@media (max-width: 600px) {
  .app {
    width: 90%;
    padding: 20px;
  }

  header h1 {
    font-size: 1.5rem;
  }

  textarea {
    font-size: 0.9rem;
  }

  input[type="submit"] {
    font-size: 0.9rem;
  }
}

</style>