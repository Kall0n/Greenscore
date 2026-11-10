let gCO2eValue;
let gRating;
let gCoverage;
let currentLang = 'fr';
let translations = {};

// Affiche les grammes sans écraser les pages sobres à « 0.00 » (constat A-10).
function formatGrams(gCO2e) {
  const value = Number(gCO2e) || 0;
  if (value === 0) return "0";
  if (value >= 0.1) return value.toFixed(2);
  return String(Number(value.toPrecision(2)));
}

// Remplace l'ancienne comparaison à une « moyenne » de 0,74 g (calibrée sur le modèle v2)
// par la note officielle SWDM v4 et le taux de requêtes dont la taille a été mesurée.
function updateRating() {
  const avgElem = document.getElementById("average-consumption");
  const line = avgElem?.parentElement;
  if (!line || !gRating) return;
  const fr = currentLang === 'fr';
  let text = fr ? `Note ${gRating} (échelle SWDM v4)` : `Rating ${gRating} (SWDM v4 scale)`;
  if (typeof gCoverage === "number" && gCoverage < 0.9) {
    const pct = Math.round(gCoverage * 100);
    text += fr ? ` · ${pct} % des requêtes mesurées` : ` · ${pct}% of requests measured`;
  }
  // Le texte est réécrit, l'élément « average-consumption » est conservé pour les rappels.
  line.textContent = "";
  const span = document.createElement("span");
  span.id = "average-consumption";
  span.textContent = text;
  line.appendChild(span);
}

async function loadTranslations(lang) {
  try {
    const response = await fetch(`./i18n/${lang}.json`);
    if (!response.ok) {
      throw new Error(`Failed to load translations for ${lang}`);
    }
    return await response.json();
  } catch (error) {
    if (lang !== 'fr') {
      return await loadTranslations('fr');
    }
    return {};
  }
}

async function initLanguage(forcedLang = null) {
  if (forcedLang) {
    currentLang = forcedLang;
    localStorage.setItem('gs_plugin_lang', forcedLang);
  } else {
    const storedLang = localStorage.getItem('gs_plugin_lang');
    if (storedLang) {
      currentLang = storedLang;
    } else {
      const browserLang = navigator.language.split('-')[0];
      currentLang = ['fr', 'en'].includes(browserLang) ? browserLang : 'en';
    }
  }

  translations = await loadTranslations(currentLang);
  applyStaticTranslations();

  if (typeof refreshDynamicTexts === 'function') {
      refreshDynamicTexts();
  }
}

function t(key, params = {}) {
  let text = (translations && translations[key]) || key;
  Object.keys(params).forEach(k => {
    text = text.replace(`{${k}}`, params[k]);
  });
  return text;
}

function applyStaticTranslations() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (translations[key]) {
        el.textContent = translations[key];
    }
  });
}

async function updateEquivalents() {
  try {
    const response = await browser.runtime.sendMessage({
      type: "getEquivalent",
      count: 3,
    });

    if (response && response.success && response.equivalents) {
      const cards = document.querySelectorAll(".comparison-card");
      response.equivalents.forEach((equivalent, index) => {
        if (cards[index]) {
          const card = cards[index];
          const img = card.querySelector("img");
          const valueElement = card.querySelector("p.text-xl");
          const description = card.querySelector("p.text-sm");

          img.src = equivalent.image || "../assets/images/default.svg";
          valueElement.textContent = equivalent.value;
          description.textContent = t(equivalent.name);
        }
      });
    }
  } catch {
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  await initLanguage();

  const frFlag = document.getElementById('lang-fr');
  const enFlag = document.getElementById('lang-en');

  if (currentLang === 'fr') {
    frFlag?.classList.add('flag-active');
    enFlag?.classList.remove('flag-active');
  } else {
    enFlag?.classList.add('flag-active');
    frFlag?.classList.remove('flag-active');
  }

  if (frFlag) {
    frFlag.addEventListener('click', async () => {
      if (currentLang !== 'fr') {
        await initLanguage('fr');
        await updateEquivalents();
        frFlag.classList.add('flag-active');
        enFlag.classList.remove('flag-active');
      }
    });
  }

  if (enFlag) {
    enFlag.addEventListener('click', async () => {
      if (currentLang !== 'en') {
        await initLanguage('en');
        await updateEquivalents();
        enFlag.classList.add('flag-active');
        frFlag.classList.remove('flag-active');
      }
    });
  }

  let isLocalhost = false;

  browser.runtime.onMessage.addListener((message) => {
    if (message.type === "localhostDetected") {
      isLocalhost = true;
      const mainContainer = document.getElementById("main-container");
      if (mainContainer) {
        while (mainContainer.firstChild) {
          mainContainer.removeChild(mainContainer.firstChild);
        }

        const wrapper = document.createElement("div");
        wrapper.className = "flex flex-col items-center justify-center h-full text-center gap-6 py-4 px-4";

        const title = document.createElement("p");
        title.className = "text-3xl font-bold font-outfit";
        title.textContent = message.message || "";

        const detailsButton = document.createElement("a");
        detailsButton.id = "details-button";
        detailsButton.className = "flex justify-center items-center py-2 px-4 text-white font-outfit font-medium bg-gs-green-950 rounded-lg";
        detailsButton.textContent = t("more_details");

        const rawUrl = `${CONFIG.BACKEND.BASE_URL}/#`;
        try {
          const parsed = new URL(rawUrl);
          detailsButton.href = parsed.toString();
        } catch (e) {
          detailsButton.href = "#";
          detailsButton.setAttribute("aria-disabled", "true");
        }

        wrapper.appendChild(title);
        wrapper.appendChild(detailsButton);
        mainContainer.appendChild(wrapper);

        if (detailsButton) {
          detailsButton.addEventListener("click", (event) => {
            event.preventDefault();
            if (detailsButton.href && detailsButton.href !== "#") {
              browser.tabs.create({ url: detailsButton.href });
            }
          });
        }
      }
    }
  });

  if (!isLocalhost) {
    // Couleurs alignées sur les notes SWDM v4 : A+/A vert, B/C jaune, D/E orange, F rouge.
    function getColorClass(gCO2e) {
      const value = Number(gCO2e);

      if (value <= 0.079) {
        return {
          text: "text-[#617D3B]",
          bg: "bg-[#ECFDF2]",
          border: "border-[#6D874B]",
        };
      } else if (value <= 0.209) {
        return {
          text: "text-[#EAC13A]",
          bg: "bg-[#FFF1C5]",
          border: "border-[#EAC13A]",
        };
      } else if (value <= 0.359) {
        return {
          text: "text-[#E98035]",
          bg: "bg-[#F9D2B6]",
          border: "border-[#E98035]",
        };
      } else {
        return {
          text: "text-[#BD2525]",
          bg: "bg-[#FFB7B7]",
          border: "border-[#BD2525]",
        };
      }
    }

    function updateColors(gCO2e) {
      const colorClasses = getColorClass(gCO2e);

      const gCO2eContainer = document.getElementById("gCO2e-container");
      const gCO2eValue = document.getElementById("gCO2e-value");

      if (gCO2eContainer && gCO2eValue) {
        gCO2eContainer.className = `flex items-baseline font-outfit ${colorClasses.text}`;
        gCO2eValue.textContent = `${gCO2e}\u00A0`;
      }

      const comparisonCards = document.querySelectorAll(".comparison-card");
      comparisonCards.forEach((card) => {
        card.className = `comparison-card flex flex-col p-2 w-[120px] h-[120px] ${colorClasses.bg} ${colorClasses.text} gap-2 border ${colorClasses.border} rounded-[4px]`;
      });
    }


    // Lance toutes les requêtes en parallèle
    const [gCO2eResponse, userData, countryResponse] = await Promise.all([
      browser.runtime.sendMessage({ type: "getgCO2e" }),
      browser.runtime.sendMessage({ type: "checkLoginStatus" }),
      browser.runtime.sendMessage({ type: "getCountryAndUrl" })
    ]);

    // 1. Gestion de gCO2e
    try {
      if (gCO2eResponse && gCO2eResponse.gCO2e !== undefined) {
        gCO2eValue = formatGrams(gCO2eResponse.gCO2e);
        gRating = gCO2eResponse.rating;
        gCoverage = gCO2eResponse.coverage;
        updateColors(gCO2eValue);
        updateRating();
      } else {
        updateColors(0);
      }
    } catch (error) {
       console.error("Erreur récupération gCO2e:", error);
    }

    // 2. Vérification du statut de connexion
    try {
      const loginSection = document.querySelector(
        ".flex.font-outfit.text-sm.justify-center"
      );
      const detailsButton = document.getElementById("details-button");

      if (loginSection) {

        while (loginSection.firstChild) {
          loginSection.removeChild(loginSection.firstChild);
        }

        if (userData.isLoggedIn) {
          const connectedSpan = document.createElement("span");
          connectedSpan.id = "user-connected-msg";
          connectedSpan.className = "text-sm text-[#6D874B] font-bold";
          connectedSpan.textContent = t("logged_in");
          loginSection.appendChild(connectedSpan);
        } else {
          const promptSpan = document.createElement("span");
          promptSpan.id = "login-prompt-msg";
          promptSpan.className = "text-sm text-grey-950";
          promptSpan.textContent = t("save_prompt") + " ";

          const loginLink = document.createElement("a");
          loginLink.id = "login-link-action";
          loginLink.className = "text-[#6D874B] font-bold underline cursor-pointer";
          loginLink.textContent = t("sign_in");

          try {
            const parsed = new URL(CONFIG.BACKEND.LOGIN_URL);
            loginLink.href = parsed.toString();
            loginLink.addEventListener("click", (e) => {
              e.preventDefault();
              if (loginLink.href && loginLink.href !== "#") {
                browser.tabs.create({ url: loginLink.href });
              }
            });
          } catch (err) {
            loginLink.href = "#";
            loginLink.setAttribute("aria-disabled", "true");
            loginLink.addEventListener("click", (e) => e.preventDefault());
          }

          loginSection.appendChild(promptSpan);
          loginSection.appendChild(loginLink);
        }
      }

      if (detailsButton) {
        detailsButton.addEventListener("click", async (e) => {
          e.preventDefault();

          if (userData.isLoggedIn) {
            await browser.runtime.sendMessage({
              type: "sendDataToDB"
            })
          }

          const response = await browser.runtime.sendMessage({
            type: "getFullDetails",
          });

          let url = CONFIG.BACKEND.DETAILS_URL;

          if (!userData.isLoggedIn) {
            const params = new URLSearchParams({
              country: response.country || "",
              url_full: response.urlFull || "",
              carbon_footprint: gCO2eValue || 0,
              data_transferred: response.totalResourceSize || 0,
              loading_time: response.loadTime || 0,
              queries_quantity: response.totalRequests || 0,
            });
            url += "?" + params.toString();
          }

          browser.tabs.create({ url: url });
        });
      }
    } catch {
    }

    // 3. Gestion Pays/URL
    if (countryResponse && countryResponse.country && countryResponse.url) {
      const urlElement = document.getElementById("site-url");
      const countryElement = document.getElementById("site-country");

      if (countryElement && urlElement) {
        countryElement.textContent = t("country_consumption_intro", { countryName: countryResponse.country });
        urlElement.textContent = countryResponse.url;
      }
    }

    // 4. Equivalents
    try {
      await updateEquivalents();
    } catch {
    }
  }
});


function refreshDynamicTexts() {
    updateEquivalents();

    if (typeof gCO2eValue !== 'undefined') {
        updateRating();
    }

    browser.runtime.sendMessage({ type: "getCountryAndUrl" }).then(response => {
         if (response && response.country) {
            const countryElement = document.getElementById("site-country");
            if (countryElement) countryElement.textContent = t("country_consumption_intro", { countryName: response.country });
         }
    });

    const promptSpan = document.getElementById("login-prompt-msg");
    if (promptSpan) {
         promptSpan.textContent = t("save_prompt") + " ";
    }

    const loginLink = document.getElementById("login-link-action");
    if(loginLink) {
        loginLink.textContent = t("sign_in");
    }

    const connectedMsg = document.getElementById("user-connected-msg");
    if (connectedMsg) {
        connectedMsg.textContent = t("logged_in");
    }

    const detailsBtn = document.getElementById("details-button");
    if (detailsBtn) {
        detailsBtn.textContent = t("more_details");
    }
}
