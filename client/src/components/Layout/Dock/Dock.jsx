import "./Dock.css";

import {
    Search,
    X,
} from "lucide-react";

import SearchBar from "../../UI/SearchBar/SearchBar";
import IconButton from "../../UI/IconButton/IconButton";

function Dock({

    activeTable,
    selectedRecord,
    onCreate,

    searchQuery,
    setSearchQuery,

}) {
    return (
        <div className="dock">

            <SearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search tables..."
            />

            <IconButton
                icon={searchQuery ? X : Search}
                onClick={() => {

                    if (!searchQuery) return;

                    setSearchQuery("");

                }}
            />

        </div>
    );
}

export default Dock;