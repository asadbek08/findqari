const fileInput = document.getElementById("fileInput");
const audioFilePreview = document.getElementById("audioFilePreview");
const audiosWrapper = document.querySelector(".audios_wrapper");
const audioRecorder = document.getElementById("audioRecorder");
// const audioRecorder = document.getElementById("audioRecorder");
const audioPlayback = document.getElementById("audioPlayback");
const audioFileInput = document.getElementById("audioFile");
const uploadBoxWrapper = document.querySelector("#audio_file_box"); // The upload container
const timer = document.getElementById("recordingTimer");

let mediaRecorder;
let audioChunks = [];
let timerInterval;

// Handle file input change
fileInput.addEventListener("change", (event) => {
  const file = event.target.files[0];

  if (file) {
    // Disable the record button during file upload
    audioRecorder.classList.add("disabled");

    // Generate audio preview
    const audioURL = URL.createObjectURL(file);
    audioFilePreview.src = audioURL;
    audioFilePreview.style.display = "block";
    audiosWrapper.style.display = "flex";

    // Display the file name
    let fileName = file.name;
    if (fileName.length > 20) {
      fileName = fileName.substring(0, 13) + "...";
    }

    document.getElementById("fileNameDisplay").textContent = fileName;
  }
});

// Handle audio recording
audioRecorder.addEventListener("click", async (event) => {
  event.preventDefault();

  if (!mediaRecorder || mediaRecorder.state === "inactive") {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder = new MediaRecorder(stream);

      audioChunks = [];

      // Disable upload box during recording
      uploadBoxWrapper.classList.add("disabled");

      fileInput.disabled = true;
      fileInput.value = "";
      document.getElementById("fileNameDisplay").textContent = "";
      audioFilePreview.style.display = "none";

      startTimer();

      mediaRecorder.ondataavailable = (event) => audioChunks.push(event.data);

      mediaRecorder.onstop = async () => {
        clearInterval(timerInterval);
        resetTimer();

        const audioBlob = new Blob(audioChunks, { type: "audio/webm" });
        const audioURL = URL.createObjectURL(audioBlob);
        audioPlayback.classList.remove("hide");
        audioPlayback.src = audioURL;

        const file = new File([audioBlob], "recorded_audio.webm", {
          type: "audio/webm",
        });
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        audioFileInput.files = dataTransfer.files;
      };

      mediaRecorder.start();
    } catch (error) {
      console.error("Error accessing microphone:", error);
    }
  } else if (mediaRecorder.state === "recording") {
    mediaRecorder.stop();
  }
});

// Timer functions
function startTimer() {
  let seconds = 0;
  timerInterval = setInterval(() => {
    seconds++;
    timer.textContent = formatTime(seconds);
  }, 1000);
}

function resetTimer() {
  clearInterval(timerInterval);
  timer.textContent = "00:00";
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const secs = (seconds % 60).toString().padStart(2, "0");
  return `${mins}:${secs}`;
}
