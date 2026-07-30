import "./SearchBar.css";

function SearchBar({

    value = "",
    onChange,

    placeholder = "Search...",

}) {

    return (

        <input
            className="searchBar"
            type="text"
            value={value}
            onChange={(event) => onChange?.(event.target.value)}
            placeholder={placeholder}
        />

    );

}

export default SearchBar;