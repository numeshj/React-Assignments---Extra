import BackToHome from "../component/BackToHome";
import { useState, useEffect } from "react";
import axios from "axios";
import "../assignments/ASG_9.css";

export default function AGS_9() {
  const [colors, setColors] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const url = `https://apis.dnjs.lk/objects/colors.php?search=${searchTerm}&page=${page}&limit=${limit}`;
        const response = await axios.get(url);
        const responseData = response.data;
        setColors(responseData.data);
        setPage(responseData.page);
        setLimit(responseData.limit);
        const totalItems = responseData.total;
        const pages = Math.ceil(totalItems / responseData.limit);
        setTotalPages(pages);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    fetchData();
  }, [searchTerm, page, limit]);

  const handleSearch = () => {
    setPage(1);
  };

  return (
    <>
      <BackToHome />
      <h1 className="assignment-title">Assignment-9</h1>
      <hr />
      <br />
      <div className="main-body">
        <h2>Colors</h2>
        <label>Search: </label>
        <input
          className="asg9-search-input"
          placeholder="Enter the color"
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button className="asg9-search-btn" onClick={handleSearch}>
          Search
        </button>
        <ul className="asg9-color-list">
          {colors.map((item, index) => (
            <li className="asg9-color-item" key={index}>
              <span
                className="asg9-color-box"
                style={{ backgroundColor: item.code }}
              ></span>
              {item.name} - {item.code}
            </li>
          ))}
        </ul>
        <div className="asg9-pagination">
          <button
            className="asg9-page-btn-main"
            onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
            disabled={page === 1}
          >
            Previous
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
            <button
              key={num}
              className={`asg9-page-btn${
                page === num ? " asg9-page-btn-active" : ""
              }`}
              onClick={() => setPage(num)}
            >
              {num}
            </button>
          ))}
          <button
            className="asg9-page-btn-main"
            onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={page === totalPages}
          >
            Next
          </button>
        </div>
        <div className="asg9-items-per-page">
          <label htmlFor="itemsPerPage">Items per page: </label>
          <select
            id="itemsPerPage"
            value={limit}
            onChange={(e) => {
              setLimit(Number(e.target.value));
              setPage(1);
            }}
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>
      </div>
    </>
  );
}
