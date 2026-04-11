import menu from "../menu.json";
import { NavLink } from 'react-router-dom';

const MenuList = ({ setIsMenuOpen }) => {
    return menu.map(
        (item, i) => (
            <NavLink
                key={i}
                to={item.url}
                className={({ isActive }) => `menu-link${isActive ? " active" : ""}`}
                {...(setIsMenuOpen && { onClick: () => setIsMenuOpen(false) })}
            >
                {item.label}
            </NavLink>
        )
    );
}

export default MenuList;
