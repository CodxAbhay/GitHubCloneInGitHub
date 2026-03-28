import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Navbar from "../user/Navbar";
import RepoCard from "../repo/RepoCard";
import "./search.css";
import { API_BASE_URL } from "../../apiBase";

const SearchPage = () => {

  const [searchParams] = useSearchParams();
  const query = searchParams.get("q");

  const [results, setResults] = useState([]);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const endpoint = query 
          ? `${API_BASE_URL}/repo/search/${encodeURIComponent(query)}`
          : `${API_BASE_URL}/repo/all`;

        const response = await fetch(endpoint);
        const data = await response.json();
        const repos = Array.isArray(data.data) ? data.data : [];
        setResults(repos);
      } catch (err) {
        console.error(err);
      }
    };

    fetchResults();
  }, [query]);

  return (
    <>
      <Navbar />

      <div className="search-page">

        {query ? (
          <h2>Search results for: <span>{query}</span></h2>
        ) : (
          <h2>Explore Public Repositories</h2>
        )}

        {results.length === 0 ? (
          <p>No repositories found</p>
        ) : (

          <div className="search-grid">

            {results.map(repo => (
              <RepoCard key={repo._id} repo={repo} />
            ))}

          </div>

        )}

      </div>
    </>
  );
};

export default SearchPage;