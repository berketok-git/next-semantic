import React, { useState, useEffect } from "react";
import Balancer from "react-wrap-balancer";
import AILoader from "../UI/AILoader";

export default function SemanticSearch() {
  const [searchTerm, setSearchTerm] = useState("");
  const [token, setToken] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMess, setErrorMess] = useState("");
  const [searchErrorMess, setSearchErrorMess] = useState("");
  const [answer, setAnswer] = useState("");
  const [currentPageNumber, setCurrentPageNumber] = useState(1);
  const [pageNumbers, setPageNumbers] = useState([]);

  useEffect(() => {
    if (pageNumbers.length) {
      setCurrentPageNumber(pageNumbers[0]);
    }
  }, [pageNumbers]);

  const embedSearchTerm = async () => {
    const body = new FormData();
    body.append("searchTerm", searchTerm);
    body.append("token", token);
    const result = await fetch("/api/vsearch/embed", {
      method: "POST",
      body,
    });
    if (!result.ok) {
      const mess = await result.text();
      throw new Error(mess);
    }
    const chunks = await result.json();
    if (!chunks.length) {
      setErrorMess("Sorry, I was unable to find a match");
      return;
    }
    setPageNumbers(chunks.map((c) => c.page_no));

    return chunks;
  };

  const getAnswer = async (chunks) => {
    const body = {
      searchTerm,
      chunks,
    };

    const response = await fetch("/api/vsearch/answer", {
      method: "POST",
      body: JSON.stringify(body),
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const message = await response.text();
      throw new Error(message);
    }

    const stream = response.body;
    const reader = stream.getReader();

    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      const chunk = new TextDecoder("utf-8").decode(value);
      setAnswer((prev) => prev + chunk);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isLoading) return;

    setSearchErrorMess("");
    if (!searchTerm.length) {
      setSearchErrorMess("Please fill this out");
      return;
    }

    setIsLoading(true);
    try {
      const chunks = await embedSearchTerm();
      if (chunks.length) {
        await getAnswer(chunks);
      }
    } catch (err) {
      setErrorMess(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setSearchTerm("");
    setErrorMess("");
    setSearchErrorMess("");
    setAnswer("");
  };

  return (
    <div className="bg-bg2 min-h-screen py-20 px-6 flex flex-col gap-6 items-center">
      <h1 className="text-2xl font-bold text-center">
        <Balancer>Semantic Search Experiment</Balancer>
      </h1>
      <div className="flex flex-col gap-4"></div>
      <form
        className="w-full md:w-[400px] flex flex-col gap-6"
        onSubmit={handleSearch}
      >
        <div className="mx-auto"></div>
        {isLoading ? (
          <AILoader className="[&>img]:h-[130px] m-auto" />
        ) : (
          <>
            {errorMess ? (
              <div className="font-mono m-auto text-center flex flex-col gap-6">
                <div className="text-xl text-red-500 max-w-[500px] overflow-auto">
                  <Balancer>{errorMess}</Balancer>
                </div>
                <button
                  type="button"
                  className="btn-bordered w-32 mx-auto hover:bg-bg0"
                  onClick={(e) => {
                    e.preventDefault();
                    setErrorMess(false);
                  }}
                >
                  Try Again
                </button>
              </div>
            ) : (
              <>
                {answer ? (
                  <div className="flex flex-col gap-6 text-mono overflow-auto">
                    <div>{answer}</div>
                    <button
                      type="button"
                      className="btn-bordered w-32 mx-auto hover:bg-bg0"
                      onClick={(e) => {
                        e.stopPropagation();
                        resetForm();
                      }}
                    >
                      Try Again
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-6 my-auto">
                    <div className="flex flex-col gap-1">
                      <input
                        className="input-base"
                        placeholder="Enter search term"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onFocus={(e) => e.target.select()}
                      />
                      <p className="text-sm text-red-500 font-mono pl-2">
                        {searchErrorMess}
                      </p>
                    </div>
                    <button
                      type="submit"
                      className="btn-bordered w-32 mx-auto hover:bg-bg0"
                    >
                      Search
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </form>
    </div>
  );
}
