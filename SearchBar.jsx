import Icon from "./Icon";

export default function SearchBar({ value, onChange, placeholder = "Search tasks..." }) {
  return (
    <div className="search">
      <label htmlFor="task-search" className="visually-hidden">
        Search tasks
      </label>
      <Icon name="search" size={16} />
      <input
        id="task-search"
        type="search"
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}
