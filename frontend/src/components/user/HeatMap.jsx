import React, { useEffect, useState } from "react";
import HeatMap from "@uiw/react-heat-map";
import "./profile.css";
import { API_BASE_URL } from "../../apiBase";


const getPanelColors = (maxCount) => {
  const colors = {};
  for (let i = 0; i <= maxCount; i++) {
    const greenValue = Math.floor((i / maxCount) * 255);
    colors[i] = `rgb(0, ${greenValue}, 0)`;
  }

  return colors;
};

const HeatMapProfile = ({ userId }) => {
  const [activityData, setActivityData] = useState([]);
  const [panelColors, setPanelColors] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      if (!userId) return;
      try {
        const repoRes = await fetch(`${API_BASE_URL}/repo/public/user/${userId}`);
        const repoData = await repoRes.json();
        const repos = repoData?.data || [];
        const dateCount = new Map();

        await Promise.all(
          repos.map(async (repo) => {
            const cRes = await fetch(`${API_BASE_URL}/commit/repo/${repo._id}`);
            const cData = await cRes.json();
            (cData?.data || []).forEach((c) => {
              const d = new Date(c.createdAt).toISOString().split("T")[0];
              dateCount.set(d, (dateCount.get(d) || 0) + 1);
            });
          }),
        );

        const today = new Date();
        const oneYearAgo = new Date();
        oneYearAgo.setDate(today.getDate() - 364);
        const data = [];
        for (
          let d = new Date(oneYearAgo);
          d <= today;
          d.setDate(d.getDate() + 1)
        ) {
          const key = d.toISOString().split("T")[0];
          data.push({ date: key, count: dateCount.get(key) || 0 });
        }
        setActivityData(data);
        const maxCount = Math.max(1, ...data.map((x) => x.count));
        setPanelColors(getPanelColors(maxCount));
      } catch {
        setActivityData([]);
      }
    };

    fetchData();
  }, [userId]);

  return (
    <div>
      <h4>Recent Contributions</h4>
      <HeatMap
        className="HeatMapProfile"
        style={{ maxWidth: "700px", height: "200px", color: "white" }}
        value={activityData}
        weekLabels={["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]}
        startDate={new Date(new Date().setDate(new Date().getDate() - 364))}
        rectSize={15}
        space={3}
        rectProps={{
          rx: 2.5,
        }}
        panelColors={panelColors}
      />
    </div>
  );
};

export default HeatMapProfile;