// script.js with final fixes: CVV + card visibility, full password info
const auth = firebase.auth();
const db = firebase.firestore();
const masterKey = "SavekeeMasterKey";

const cardForm = document.getElementById('cardForm');
const cardNumber = document.getElementById('cardNumber');
const expiryDate = document.getElementById('expiryDate');
const cvv = document.getElementById('cvv');
const cardInfo = document.getElementById('cardInfo');

const passwordForm = document.getElementById('passwordForm');
const website = document.getElementById('website');
const username = document.getElementById('username');
const password = document.getElementById('password');
const passwordInfo = document.getElementById('passwordInfo');

function encrypt(data) {
  return CryptoJS.AES.encrypt(JSON.stringify(data), masterKey).toString();
}

function decrypt(cipherText) {
  try {
    const bytes = CryptoJS.AES.decrypt(cipherText, masterKey);
    return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
  } catch {
    return null;
  }
}

function showToast(message) {
  let toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2000);
}

function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => showToast("Copied!"));
}

function logout() {
  auth.signOut().then(() => {
    window.location.href = "index.html";
  });
}

auth.onAuthStateChanged(user => {
  if (!user) {
    window.location.href = "index.html";
  } else {
    listenToUserData(user.uid);
  }
});

cardForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const user = auth.currentUser;
  if (!user) return;

  const card = {
    number: cardNumber.value,
    expiry: expiryDate.value,
    cvv: cvv.value,
    timestamp: Date.now()
  };

  const encrypted = encrypt(card);
  await db.collection("users").doc(user.uid).collection("cards").add({ data: encrypted });
  cardForm.reset();
  showToast("Card saved!");
});

passwordForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const user = auth.currentUser;
  if (!user) return;

  const pass = {
    website: website.value,
    username: username.value,
    password: password.value,
    timestamp: Date.now()
  };

  const encrypted = encrypt(pass);
  await db.collection("users").doc(user.uid).collection("passwords").add({ data: encrypted });
  passwordForm.reset();
  showToast("Password saved!");
});

function listenToUserData(uid) {
  db.collection("users").doc(uid).collection("cards")
    .onSnapshot(snapshot => {
      cardInfo.innerHTML = "";
      snapshot.forEach(doc => renderCard(doc.id, decrypt(doc.data().data)));
    });

  db.collection("users").doc(uid).collection("passwords")
    .onSnapshot(snapshot => {
      passwordInfo.innerHTML = "";
      snapshot.forEach(doc => renderPassword(doc.id, decrypt(doc.data().data)));
    });
}

function renderCard(id, data) {
  const div = document.createElement("div");
  div.className = "entry";
  div.innerHTML = `💳 
    <span class="copyable" data-value="${data.number}" data-actual="${data.number}">${data.number}</span>
    <span class="copyable" data-value="${data.expiry}">${data.expiry}</span>
    <span class="secret" data-actual="${data.cvv}">***</span>
    <i class="fas fa-eye" onclick="toggleSecret(this)"></i>
    <i class="fas fa-pen" onclick='inlineEditCard("${id}", this)'></i>
    <i class="fas fa-trash" onclick="deleteEntry('cards', '${id}')"></i>`;
  div.querySelectorAll(".copyable").forEach(span => {
    span.addEventListener("click", () => copyToClipboard(span.dataset.value));
  });
  cardInfo.appendChild(div);
}

function renderPassword(id, data) {
  const div = document.createElement("div");
  div.className = "entry";
  div.innerHTML = `🌐 
    <span class="copyable" data-value="${data.website}">${data.website}</span>
    <span class="copyable" data-value="${data.username}">${data.username}</span>
    <span class="secret" data-actual="${data.password}">••••••••</span>
    <i class="fas fa-eye" onclick="toggleSecret(this)"></i>
    <i class="fas fa-pen" onclick='inlineEditPassword("${id}", this)'></i>
    <i class="fas fa-trash" onclick="deleteEntry('passwords', '${id}')"></i>`;
  div.querySelectorAll(".copyable").forEach(span => {
    span.addEventListener("click", () => copyToClipboard(span.dataset.value));
  });
  passwordInfo.appendChild(div);
}

function toggleSecret(icon) {
  const span = icon.previousElementSibling;
  const actual = span.dataset.actual;
  const isMasked = span.textContent.includes("•") || span.textContent.includes("*");
  span.textContent = isMasked ? actual : "••••••••";
}

async function deleteEntry(collection, id) {
  if (confirm("Are you sure you want to delete this?")) {
    const user = auth.currentUser;
    await db.collection("users").doc(user.uid).collection(collection).doc(id).delete();
    showToast("Deleted");
  }
}

function inlineEditCard(id, icon) {
  const div = icon.parentElement;
  const spans = div.querySelectorAll("span");
  spans.forEach(s => s.contentEditable = true);
  icon.className = "fas fa-save";
  icon.onclick = async () => {
    const user = auth.currentUser;
    const newData = {
      number: spans[0].innerText,
      expiry: spans[1].innerText,
      cvv: spans[2].innerText,
      timestamp: Date.now()
    };
    await db.collection("users").doc(user.uid).collection("cards").doc(id).set({ data: encrypt(newData) });
    showToast("Card updated");
  };
}

function inlineEditPassword(id, icon) {
  const div = icon.parentElement;
  const spans = div.querySelectorAll("span");
  spans.forEach(s => s.contentEditable = true);
  icon.className = "fas fa-save";
  icon.onclick = async () => {
    const user = auth.currentUser;
    const newData = {
      website: spans[0].innerText,
      username: spans[1].innerText,
      password: spans[2].innerText,
      timestamp: Date.now()
    };
    await db.collection("users").doc(user.uid).collection("passwords").doc(id).set({ data: encrypt(newData) });
    showToast("Password updated");
  };
}
