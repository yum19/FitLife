import PropTypes from "prop-types";
import { Link } from "react-router-dom";

export default function CardProduitsCatalog({ produits, color = "light" }) {
  // Configuration for categories
  const categoryConfig = {
    "Food supplements": {
      label: "Food supplements",
      icon: "fas fa-pills",
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    "Sports equipment": {
      label: "Sports equipment",
      icon: "fas fa-dumbbell",
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
  };

  const handleDelete = async (id) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce produit ?")) {
      try {
        const response = await fetch(`http://localhost:5000/api/produits/${id}`, {
          method: "DELETE",
        });
        if (!response.ok) throw new Error("Failed to delete produit");
        window.location.reload(); // Refresh to reflect deletion
      } catch (error) {
        console.error("Error deleting produit:", error);
      }
    }
  };

  console.log("Produits data:", produits); // Debug log to check data

  return (
    <div
      className={
        "relative flex flex-col min-w-0 break-words w-full mb-6 shadow-lg rounded " +
        (color === "light" ? "bg-white" : "bg-lightBlue-900 text-white")
      }
    >
      <div className="rounded-t mb-0 px-4 py-3 border-0">
        <div className="flex flex-wrap items-center">
          <div className="relative w-full px-4 max-w-full flex-grow flex-1">
            <h3
              className={
                "font-semibold text-lg flex items-center " + (color === "light" ? "text-blueGray-700" : "text-white")
              }
            >
              <i className="fas fa-box-open mr-3 text-blue-600"></i>
              Catalogue sport & nutrition
              <span className="ml-3 text-sm font-normal text-blueGray-500">
                ({produits.length} product{produits.length !== 1 ? "s" : ""})
              </span>
            </h3>
          </div>
          <div className="relative w-full px-4 max-w-full flex-grow flex-1 text-right">
            <Link
              to="/admin/tables/produits/new"
              className="bg-lightBlue-500 text-white active:bg-lightBlue-600 text-xs font-bold uppercase px-4 py-2 rounded shadow hover:shadow-md outline-none focus:outline-none mr-1 ease-linear transition-all duration-150"
            >
              <i className="fas fa-plus mr-1"></i>
              Add Product
            </Link>
          </div>
        </div>
      </div>

      <div className="block w-full overflow-x-auto">
        <table className="items-center w-full bg-transparent border-collapse">
          <thead>
            <tr>
              <th
                className={
                  "px-6 align-middle border border-solid py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left " +
                  (color === "light"
                    ? "bg-blueGray-50 text-blueGray-500 border-blueGray-100"
                    : "bg-lightBlue-800 text-lightBlue-300 border-lightBlue-700")
                }
              >
                Name
              </th>
              <th
                className={
                  "px-6 align-middle border border-solid py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left " +
                  (color === "light"
                    ? "bg-blueGray-50 text-blueGray-500 border-blueGray-100"
                    : "bg-lightBlue-800 text-lightBlue-300 border-lightBlue-700")
                }
              >
                Category
              </th>
              <th
                className={
                  "px-6 align-middle border border-solid py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left " +
                  (color === "light"
                    ? "bg-blueGray-50 text-blueGray-500 border-blueGray-100"
                    : "bg-lightBlue-800 text-lightBlue-300 border-lightBlue-700")
                }
              >
                Brand
              </th>
              <th
                className={
                  "px-6 align-middle border border-solid py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left " +
                  (color === "light"
                    ? "bg-blueGray-50 text-blueGray-500 border-blueGray-100"
                    : "bg-lightBlue-800 text-lightBlue-300 border-lightBlue-700")
                }
              >
                Price
              </th>
              <th
                className={
                  "px-6 align-middle border border-solid py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left " +
                  (color === "light"
                    ? "bg-blueGray-50 text-blueGray-500 border-blueGray-100"
                    : "bg-lightBlue-800 text-lightBlue-300 border-lightBlue-700")
                }
              >
                Added date
              </th>
              <th
                className={
                  "px-6 align-middle border border-solid py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left " +
                  (color === "light"
                    ? "bg-blueGray-50 text-blueGray-500 border-blueGray-100"
                    : "bg-lightBlue-800 text-lightBlue-300 border-lightBlue-700")
                }
              >
                Description
              </th>
              <th
                className={
                  "px-6 align-middle border border-solid py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left " +
                  (color === "light"
                    ? "bg-blueGray-50 text-blueGray-500 border-blueGray-100"
                    : "bg-lightBlue-800 text-lightBlue-300 border-lightBlue-700")
                }
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {produits.length === 0 ? (
              <tr>
                <td
                  colSpan="7"
                  className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4 text-center text-blueGray-500"
                >
                  No product is available
                </td>
              </tr>
            ) : (
              produits.map((produit, index) => {
                const category = categoryConfig[produit.categorie] || {
                  label: produit.categorie,
                  icon: "fas fa-box",
                  color: "text-gray-600",
                  bgColor: "bg-gray-100",
                };

                return (
                  <tr key={produit._id || index}>
                    <th className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4 text-left flex items-center">
                      {produit.image && (
                        <img src={produit.image} alt={produit.nom} className="h-16 w-16 rounded-full mr-3 object-cover" />
                      )}
                      <span className={"ml-3 font-bold " + (color === "light" ? "text-blueGray-600" : "text-white")}>
                        {produit.nom}
                      </span>
                    </th>
                    <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${category.bgColor} ${category.color}`}
                      >
                        <i className={`${category.icon} mr-1`}></i>
                        {category.label}
                      </span>
                    </td>
                    <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">
                      {produit.marque}
                    </td>
                    <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">
                      ${produit.prix.toFixed(2)}
                    </td>
                    <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">
                      {produit.createdAt ? new Date(produit.createdAt).toLocaleDateString("fr-FR") : "N/A"}
                    </td>
                    <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-normal break-words p-4 max-w-sm">
  {produit.description}
</td>

                    <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4 text-right min-w-[250px]">
                      <Link
                        to={`/admin/tables/produits/edit/${produit._id}`}
                        className="bg-yellow-500 text-white p-3 rounded mr-2 hover:bg-yellow-600 inline-block"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(produit._id)}
                        className="bg-red-500 text-white p-3 rounded hover:bg-red-600 inline-block"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

CardProduitsCatalog.propTypes = {
  produits: PropTypes.array.isRequired,
  color: PropTypes.oneOf(["light", "dark"]),

};