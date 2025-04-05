let input, button;
let stockPrice = "Enter a stock symbol to get started";
let stockSymbol = "";
let prevPrice = null;
let emotion = "Neutral";
let priceChange = 0;
let apiKeyAlpha = "KOBZHNP6BO8K3L8O";
let apiKeyNews = "32pbV7NhyfGPZ1rHTVlOa43g8HmLfQd1XXOqKCOY";
let apiKeySEC = "YOUR_SEC_API_KEY";
let newsData = [];
let macroNewsData = []; // New: Macro news array
let stockHistory = [];
let sentimentText = "";
let stockSentiment = "";
let secFilings = [];
let peopleSentiment = { positive: 0, negative: 0, neutral: 0 };
let selectedPeriod = "1week";

function setup() {
  createCanvas(800, 800);
  background(240);
  displayWelcomeMessage();
  input = createInput();
  input.position(width / 2 - 100, height / 2 - 50);
  input.size(200);
  button = createButton('Search');
  button.position(input.x + input.width + 10, input.y);
  button.mousePressed(fetchStockData);
  createTimelineButtons();
  textSize(18);
  fill(0);
  textAlign(CENTER, CENTER);
}

function displayWelcomeMessage() {
  textSize(14);
  fill(0);
  textAlign(CENTER, TOP);
  text("Welcome to Alpha Vantage! Here is your API key: " + apiKeyAlpha, width / 2, 20);
  text("Please record this API key at a safe place for future data access.", width / 2, 40);
  textSize(16);
  textAlign(CENTER, TOP);
  text("This platform uses various data APIs to analyze stock trends and market sentiment.", width / 2, 60);
}

function createTimelineButtons() {
  const periods = ["1week", "1month", "1year"];
  const buttonWidth = 80;
  const buttonHeight = 30;

  periods.forEach((period, idx) => {
    let periodButton = createButton(period);
    periodButton.position(10 + (buttonWidth + 10) * idx, height - 50);
    periodButton.size(buttonWidth, buttonHeight);
    periodButton.mousePressed(() => selectPeriod(period));
  });
}

function selectPeriod(period) {
  selectedPeriod = period;
  stockHistory = [];
  fetchStockData();
}

function fetchStockData() {
  stockSymbol = input.value().toUpperCase();

  if (stockSymbol === "") {
    stockPrice = "Please enter a stock symbol!";
    emotion = "Neutral";
    sentimentText = "";
    stockSentiment = "";
    return;
  }

  fetchStockFromAPI(stockSymbol);
  fetchNewsFromAPI(stockSymbol);
  fetchMacroNews(); // NEW: fetch broader economic news
  fetchSecFilingsFromAPI(stockSymbol);
}

function fetchStockFromAPI(symbol) {
  let stockURL = `https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=${symbol}&interval=5min&apikey=${apiKeyAlpha}`;

  fetch(stockURL)
    .then(response => response.json())
    .then(data => {
      if (data["Time Series (5min)"]) {
        const timeSeries = data["Time Series (5min)"];
        const latestTime = Object.keys(timeSeries)[0];
        const latestData = timeSeries[latestTime];
        const price = parseFloat(latestData["4. close"]);
        stockPrice = `${stockSymbol}: $${price.toFixed(2)}`;

        stockHistory = Object.entries(timeSeries).map(([time, values]) => {
          return {
            time,
            price: parseFloat(values["4. close"])
          };
        });

        if (prevPrice !== null) {
          priceChange = price - prevPrice;
          if (priceChange > 0) {
            emotion = "Happy";
            sentimentText = "The stock price increased due to positive market sentiment or good news.";
            stockSentiment = "Bullish";
          } else if (priceChange < 0) {
            emotion = "Sad";
            sentimentText = "The stock price decreased due to negative news or market uncertainty.";
            stockSentiment = "Bearish";
          } else {
            emotion = "Neutral";
            sentimentText = "No significant price change. The market is stable.";
            stockSentiment = "Neutral";
          }
        }

        prevPrice = price;

        if (isStockBullish()) {
          stockSentiment = "Bullish";
        } else if (isStockBearish()) {
          stockSentiment = "Bearish";
        } else {
          stockSentiment = "Neutral";
        }

      } else {
        stockPrice = "Stock not found!";
        emotion = "Neutral";
        sentimentText = "We couldn't retrieve data for this stock.";
        stockSentiment = "Neutral";
      }
    })
    .catch(error => {
      console.error("Error fetching stock data:", error);
      stockPrice = "Failed to fetch stock data.";
      emotion = "Neutral";
      sentimentText = "An error occurred while fetching stock data.";
      stockSentiment = "Neutral";
    });
}

function fetchNewsFromAPI(symbol) {
  let newsURL = `https://newsapi.org/v2/everything?q=${symbol}&apiKey=${apiKeyNews}`;

  fetch(newsURL)
    .then(response => response.json())
    .then(data => {
      if (data.articles) {
        newsData = data.articles.slice(0, 5);
        generateNewsExplanation();
      }
    })
    .catch(error => {
      console.error("Error fetching news:", error);
      newsData = [];
    });
}

function fetchMacroNews() {
  let macroURL = `https://newsapi.org/v2/everything?q=tariff+china+trump&sortBy=publishedAt&language=en&apiKey=${apiKeyNews}`;

  fetch(macroURL)
    .then(response => response.json())
    .then(data => {
      if (data.articles) {
        macroNewsData = data.articles.slice(0, 5);
      }
    })
    .catch(error => {
      console.error("Error fetching macro news:", error);
    });
}

function fetchSecFilingsFromAPI(symbol) {
  let secURL = `https://www.sec.gov/cgi-bin/browse-edgar?CIK=${symbol}&action=getcompany&owner=exclude&count=10`;

  fetch(secURL)
    .then(response => response.text())
    .then(data => {
      const parser = new DOMParser();
      const doc = parser.parseFromString(data, 'text/html');
      const filings = doc.querySelectorAll('.tableFile2 tr');

      secFilings = [];
      filings.forEach(row => {
        const link = row.querySelector('td a');
        if (link) {
          secFilings.push({
            filingType: row.querySelectorAll('td')[1].textContent.trim(),
            link: "https://www.sec.gov" + link.getAttribute('href')
          });
        }
      });
    })
    .catch(error => {
      console.error("Error fetching SEC filings:", error);
      secFilings = [];
    });
}

function generateNewsExplanation() {
  if (newsData.length > 0) {
    const article = newsData[0];
    sentimentText += ` The latest headline: "${article.title}" suggests a potential influence on the stock.`;
  }
}

function isStockBullish() {
  let recentPrices = stockHistory.slice(-5);
  return recentPrices.every((data, index, array) => index === 0 || data.price > array[index - 1].price);
}

function isStockBearish() {
  let recentPrices = stockHistory.slice(-5);
  return recentPrices.every((data, index, array) => index === 0 || data.price < array[index - 1].price);
}

function draw() {
  background(240);
  text(stockPrice, width / 2, height / 2 - 20);
  textSize(24);
  fill(getEmotionColor(emotion));
  text(emotion, width / 2, height / 2 + 20);
  textSize(14);
  fill(0);
  textAlign(CENTER, TOP);
  text(sentimentText, width / 2, height / 2 + 40);
  textSize(16);
  textAlign(CENTER, TOP);
  text(`Sentiment: ${stockSentiment}`, width / 2, height - 100);
  displayNewsArticles();
  displayMacroNews(); // NEW: display macro-level geopolitical news
  displaySecFilings();
  drawStockChart();
}

function getEmotionColor(emotion) {
  if (emotion === "Happy") return color(0, 255, 0);
  if (emotion === "Sad") return color(255, 0, 0);
  return color(0, 0, 255);
}

function displayNewsArticles() {
  if (newsData.length > 0) {
    textSize(14);
    fill(0);
    textAlign(LEFT, TOP);
    text("Latest News:", 10, height / 2 + 140);
    newsData.forEach((article, index) => {
      text(`${index + 1}. ${article.title}`, 10, height / 2 + 160 + (index * 20));
    });
  }
}

function displayMacroNews() {
  if (macroNewsData.length > 0) {
    textSize(14);
    fill(0);
    textAlign(LEFT, TOP);
    text("Macro News (Tariff/China/Trump):", 400, height / 2 + 140);
    macroNewsData.forEach((article, index) => {
      text(`${index + 1}. ${article.title}`, 400, height / 2 + 160 + (index * 20));
    });
  }
}

function displaySecFilings() {
  if (secFilings.length > 0) {
    textSize(14);
    fill(0);
    textAlign(LEFT, TOP);
    text("Latest SEC Filings:", 10, height - 140);
    secFilings.forEach((filing, index) => {
      text(`${index + 1}. ${filing.filingType}: `, 10, height - 120 + (index * 20));
      text(filing.link, 250, height - 120 + (index * 20));
    });
  }
}

function drawStockChart() {
  if (stockHistory.length === 0) return;

  const margin = 50;
  const chartWidth = width - 2 * margin;
  const chartHeight = height / 2 - margin;

  const prices = stockHistory.map(data => data.price);
  const maxPrice = Math.max(...prices);
  const minPrice = Math.min(...prices);

  stroke(200);
  line(margin, margin, margin, chartHeight);
  line(margin, chartHeight, margin + chartWidth, chartHeight);

  for (let i = 1; i < stockHistory.length; i++) {
    const prevPoint = stockHistory[i - 1];
    const currPoint = stockHistory[i];
    const prevX = map(i - 1, 0, stockHistory.length - 1, margin, margin + chartWidth);
    const currX = map(i, 0, stockHistory.length - 1, margin, margin + chartWidth);
    const prevY = map(prevPoint.price, minPrice, maxPrice, chartHeight, margin);
    const currY = map(currPoint.price, minPrice, maxPrice, chartHeight, margin);
    line(prevX, prevY, currX, currY);
  }
}
