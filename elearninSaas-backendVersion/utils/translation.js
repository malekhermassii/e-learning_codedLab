const axios = require('axios');

const GOOGLE_TRANSLATE_API = 'https://translate.googleapis.com/translate_a/single';
const LIBRETRANSLATE_API_URL = 'https://libretranslate.de/translate';

/**
 * Traduit un texte d'une langue source vers une langue cible
 * @param {string} text - Le texte à traduire
 * @param {string} sourceLang - La langue source (ex: 'fr', 'en')
 * @param {string} targetLang - La langue cible (ex: 'fr', 'en')
 * @returns {Promise<string>} - Le texte traduit
 */
async function translateText(text, sourceLang, targetLang) {
  try {
    // Essayer d'abord avec Google Translate
    const response = await axios.get(GOOGLE_TRANSLATE_API, {
      params: {
        client: 'gtx',
        sl: sourceLang,
        tl: targetLang,
        dt: 't',
        q: text
      },
      timeout: 4000
    });

    // Google Translate retourne un tableau imbriqué, nous extrayons la traduction
    const translatedText = response.data[0]
      .map(item => item[0])
      .join('');

    return translatedText || text;
  } catch (error) {
    console.error('Erreur avec Google Translate, tentative avec LibreTranslate:', error);
    
    try {
      // Fallback sur LibreTranslate
      const response = await axios.post(LIBRETRANSLATE_API_URL, {
        q: text,
        source: sourceLang,
        target: targetLang,
        format: "text"
      }, {
        timeout: 4000,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      return response.data.translatedText || text;
    } catch (libreError) {
      console.error('Erreur avec LibreTranslate:', libreError);
      return text; // Retourner le texte original en cas d'échec
    }
  }
}

/**
 * Traduit un objet en traduisant toutes les valeurs de type string
 * @param {Object} obj - L'objet à traduire
 * @param {string} sourceLang - La langue source
 * @param {string} targetLang - La langue cible
 * @returns {Promise<Object>} - L'objet avec les valeurs traduites
 */
async function translateObject(obj, sourceLang, targetLang) {
  const translatedObj = { ...obj };

  for (const key in translatedObj) {
    if (typeof translatedObj[key] === 'string') {
      translatedObj[key] = await translateText(translatedObj[key], sourceLang, targetLang);
    } else if (typeof translatedObj[key] === 'object' && translatedObj[key] !== null) {
      translatedObj[key] = await translateObject(translatedObj[key], sourceLang, targetLang);
    }
  }

  return translatedObj;
}

module.exports = {
  translateText,
  translateObject
}; 