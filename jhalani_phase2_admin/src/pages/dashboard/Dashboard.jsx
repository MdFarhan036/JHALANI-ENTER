import "../../styles/dashboard.css";

export default function Dashboard() {
  const stats = [
    {
      title: "Total Employees",
      value: "0",
      icon: "♙",
    },
    {
      title: "Total Products",
      value: "0",
      icon: "□",
    },
    {
      title: "Pending Orders",
      value: "0",
      icon: "▤",
    },
    {
      title: "Stock Items",
      value: "0",
      icon: "▥",
    },
  ];

  return (
    <div className="dashboard-page">

      <div className="dashboard-welcome">

        <div>
          <h2>
            Welcome back!
          </h2>

          <p>
            Here's what's happening
            with Jhalani Enterprises
            today.
          </p>
        </div>

        <div className="dashboard-date">
          {new Date().toLocaleDateString(
            "en-IN",
            {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            }
          )}
        </div>

      </div>


      <div className="dashboard-stats">

        {stats.map((stat) => (
          <div
            className="stat-card"
            key={stat.title}
          >

            <div className="stat-icon">
              {stat.icon}
            </div>

            <div className="stat-content">

              <span>
                {stat.title}
              </span>

              <strong>
                {stat.value}
              </strong>

            </div>

          </div>
        ))}

      </div>


      <div className="dashboard-grid">

        <div className="dashboard-panel">

          <div className="panel-header">

            <div>
              <h3>
                Recent Orders
              </h3>

              <p>
                Latest order activity
              </p>
            </div>

            <button>
              View All
            </button>

          </div>

          <div className="empty-state">

            <div className="empty-icon">
              ▤
            </div>

            <h4>
              No orders yet
            </h4>

            <p>
              Recent orders will appear
              here.
            </p>

          </div>

        </div>


        <div className="dashboard-panel">

          <div className="panel-header">

            <div>
              <h3>
                Quick Actions
              </h3>

              <p>
                Common administrative
                tasks
              </p>
            </div>

          </div>


          <div className="quick-actions">

            <button>
              <span>+</span>
              Add Employee
            </button>

            <button>
              <span>+</span>
              Add Product
            </button>

            <button>
              <span>+</span>
              Add Order
            </button>

            <button>
              <span>₹</span>
              Manage Salary
            </button>

          </div>

        </div>

      </div>


      <div className="dashboard-panel dashboard-overview">

        <div className="panel-header">

          <div>
            <h3>
              Business Overview
            </h3>

            <p>
              Your inventory management
              system overview
            </p>
          </div>

        </div>


        <div className="overview-grid">

          <div className="overview-item">
            <span>
              Departments
            </span>
            <strong>0</strong>
          </div>

          <div className="overview-item">
            <span>
              Categories
            </span>
            <strong>0</strong>
          </div>

          <div className="overview-item">
            <span>
              Active Employees
            </span>
            <strong>0</strong>
          </div>

          <div className="overview-item">
            <span>
              Pending Dispatch
            </span>
            <strong>0</strong>
          </div>

        </div>

      </div>

    </div>
  );
}