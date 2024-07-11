import React, { useState, useEffect } from "react";
import axios from "axios";
import { Button, Box, Typography } from "@mui/material";
import {
  useQuery,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";

interface Country {
  name: string;
  capital: string;
}

interface QuizItem {
  id: number;
  type: "country" | "capital";
  value: string;
  pairValue: string;
}

const fetchCountries = async (): Promise<Country[]> => {
  const response = await axios.get("https://restcountries.com/v3.1/all");
  return response.data.map((country: any) => ({
    name: country.name.common,
    capital: country.capital?.[0] || "N/A",
  }));
};

const shuffleArray = (array: any[]) => {
  return array.sort(() => Math.random() - 0.5);
};

const App: React.FC = () => {
  const {
    data: countries,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["countries"],
    queryFn: fetchCountries,
  });

  const [quizData, setQuizData] = useState<QuizItem[]>([]);
  const [selected, setSelected] = useState<QuizItem[]>([]);
  const [matched, setMatched] = useState<QuizItem[]>([]);
  const [incorrect, setIncorrect] = useState<boolean>(false);
  const [gameWon, setGameWon] = useState<boolean>(false);
  const [roundsWon, setRoundsWon] = useState<number>(0);

  const initializeGame = (countries: Country[]) => {
    const countriesWithCapitals = countries.filter(
      (country) => country.capital !== "N/A"
    );
    const selectedCountries = shuffleArray(countriesWithCapitals).slice(0, 5);

    const quizItems: QuizItem[] = [];
    let id = 1;

    selectedCountries.forEach((country) => {
      quizItems.push({
        id: id++,
        type: "country",
        value: country.name,
        pairValue: country.capital,
      });
      quizItems.push({
        id: id++,
        type: "capital",
        value: country.capital,
        pairValue: country.name,
      });
    });

    setQuizData(shuffleArray(quizItems));
    setMatched([]);
    setSelected([]);
    setGameWon(false);
  };

  useEffect(() => {
    if (countries) {
      initializeGame(countries);
    }
  }, [countries]);

  const handleButtonClick = (item: QuizItem) => {
    if (selected.length === 0) {
      setSelected([item]);
    } else if (selected.length === 1) {
      const [firstSelected] = selected;
      if (
        firstSelected.type !== item.type &&
        firstSelected.pairValue === item.value
      ) {
        setMatched((prevMatched) => {
          const newMatched = [...prevMatched, firstSelected, item];

          if (newMatched.length === quizData.length) {
            setGameWon(true);
            setRoundsWon((prevRoundsWon) => prevRoundsWon + 1);
          }

          return newMatched;
        });
        setSelected([]);
      } else {
        setSelected([...selected, item]);
        setIncorrect(true);
        setTimeout(() => {
          setSelected([]);
          setIncorrect(false);
        }, 1000);
      }
    }
  };

  const handlePlayAgain = () => {
    refetch().then(({ data }) => {
      if (data) {
        initializeGame(data);
      }
    });
  };

  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Error fetching data</div>;

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        flexDirection: "column",
      }}
    >
      <Typography variant="h4" gutterBottom>
        Capital Quiz
      </Typography>
      <Typography variant="h6" gutterBottom>
        Rounds Won: {roundsWon}
      </Typography>
      {gameWon ? (
        <Button
          variant="contained"
          color="secondary"
          onClick={handlePlayAgain}
          sx={{
            fontSize: "1.5rem",
            padding: "10px 20px",
            backgroundColor: "green",
            "&:hover": {
              backgroundColor: "darkgreen",
            },
          }}
        >
          Play again
        </Button>
      ) : (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            flexWrap: "wrap",
            gap: 2,
          }}
        >
          {quizData.map((item) =>
            !matched.find((m) => m.id === item.id) ? (
              <Button
                key={item.id}
                variant="contained"
                sx={{
                  visibility: matched.find((m) => m.id === item.id)
                    ? "hidden"
                    : "visible",
                  backgroundColor: selected.find((s) => s.id === item.id)
                    ? incorrect
                      ? "error.main"
                      : "primary.main"
                    : "info.main",
                  color: "white",
                  "&:hover": {
                    backgroundColor: selected.find((s) => s.id === item.id)
                      ? incorrect
                        ? "error.dark"
                        : "primary.dark"
                      : "info.dark",
                  },
                  fontSize: "1rem",
                  padding: "10px",
                  flexGrow: 1,
                  width: "150px",
                  minHeight: "50px",
                  textAlign: "center",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  whiteSpace: "normal",
                }}
                onClick={() => handleButtonClick(item)}
                disabled={matched.find((m) => m.id === item.id) !== undefined}
              >
                {item.value}
              </Button>
            ) : null
          )}
        </Box>
      )}
    </Box>
  );
};

const queryClient = new QueryClient();

const Root = () => (
  <QueryClientProvider client={queryClient}>
    <App />
  </QueryClientProvider>
);

export default Root;
