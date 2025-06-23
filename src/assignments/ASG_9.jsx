import BackToHome from "../component/BackToHome";
import { useState, useEffect } from "react";
import axios from "axios";
import "./ASG_9.css";

export default function ASG_9() {
  const [color, setColor] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredColors, setFilteredColors] = useState([]);

  const [currentpage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const indexOfLastItem = currentpage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredColors.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredColors.length / itemsPerPage);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(
          "https://apis.dnjs.lk/objects/colors.php"
        );
        setColor(response.data);
        setFilteredColors(response.data);
      } catch (err) {
        console.log("Error when fetch Data : ", err);
      }
    };

    fetchData();
  }, []);

  const handleSearch = () => {
    const filtered = color.filter((c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredColors(filtered);
    setCurrentPage(1);
    // console.log("Filtered List : ", filtered)
  };

  return (
    <>
      <BackToHome />
      <h1 className="assignment-title">Assignment-9</h1>
      <hr />
      <br />
      <h2>Colors</h2>
      <label>Search: </label>
      <input
        className="asg9-search-input"
        placeholder="Enter the color"
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      <button className="asg9-search-btn" onClick={handleSearch}>Search</button>

      <ul className="asg9-color-list">
        {currentItems.map((item, index) => (
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
          className="asg9-page-btn"
          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
          disabled={currentpage === 1}
        >
          Previous
        </button>

        {(() => {
          let startPage = Math.max(currentpage - 1, 1);
          let endPage = Math.min(startPage + 2, totalPages);

          if (endPage - startPage < 2) {
            startPage = Math.max(endPage - 2, 1);
          }

          return Array.from(
            { length: endPage - startPage + 1 },
            (_, i) => startPage + i
          ).map((num) => (
            <button
              className={`asg9-page-btn${currentpage === num ? " asg9-page-btn-active" : ""}`}
              key={num}
              onClick={() => setCurrentPage(num)}
            >
              {num}
            </button>
          ));
        })()}

        <button
          className="asg9-page-btn"
          onClick={() =>
            setCurrentPage((prev) => Math.min(prev + 1, totalPages))
          }
          disabled={currentpage === totalPages}
        >
          Next
        </button>
        <label className="lb-page">{`${currentpage} of ${totalPages}`}</label>
      </div>

      <div className="asg9-items-per-page">
        <label htmlFor="itemsPerPage">Items per page: </label>
        <select
          id="itemsPerPage"
          value={itemsPerPage}
          onChange={(e) => {
            setItemsPerPage(Number(e.target.value));
            setCurrentPage(1);
          }}
        >
          <option value={5}>5</option>
          <option value={10}>10</option>
          <option value={20}>20</option>
          <option value={50}>50</option>
        </select>
      </div>
    </>
  );
}
