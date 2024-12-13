// Jameson Vigar
// Data Visualization

d3.csv("spotify_tracks.csv").then(data => {
    // Parse and process data
    data.forEach(d => {
        d.popularity = +d.popularity;
        d.speechiness = +d.speechiness;
        d.valence = +d.valence;
        d.year = +d.year;
    });

    // Get unique years
    const years = [...new Set(data.map(d => d.year))];
    const yearSelect = d3.select("#yearFilter");

    // Year dropdown
    yearSelect.selectAll("option")
        .data(years)
        .enter().append("option")
        .attr("value", d => d)
        .text(d => d);

    // Set default value for dropdown
    yearSelect.property("value", Math.max(...years)); // Set to the latest year

    // Create svg for the scatter plot
    const margin = {top: 20, right: 30, bottom: 40, left: 40};
    const width = 800 - margin.left - margin.right;
    const height = 500 - margin.top - margin.bottom;

    const svg = d3.select("#scatterPlot").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Set up scales
    const xScale = d3.scaleLinear()
        .domain([0, 100]) // Popularity from 0 to 100
        .range([0, width]);

    const yScale = d3.scaleLinear()
        .domain([0, 1]) // Speechiness from 0 to 1
        .range([height, 0]);

    const xAxis = d3.axisBottom(xScale);
    const yAxis = d3.axisLeft(yScale);

    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(xAxis);

    svg.append("g")
        .call(yAxis);

    // Add axis labels
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", height + margin.bottom - 10)
        .style("text-anchor", "middle")
        .text("Popularity");

    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -margin.left + 10)
        .style("text-anchor", "middle")
        .text("Speechiness");

    // Tooltip
    const tooltip = d3.select("#tooltip");

    // Update the scatter plot based on filters
    function updateVisualization() {
        const yearFilter = +document.getElementById("yearFilter").value;
        const popularityFilter = +document.getElementById("popularityFilter").value;
        const speechinessFilter = +document.getElementById("speechinessFilter").value;
        const valenceFilter = +document.getElementById("valenceFilter").value;

        // Update the year display
        document.getElementById("selectedYear").textContent = `Year: ${yearFilter}`;

        // Filter data based on selected filters
        const filteredData = data.filter(d => {
            return d.year === yearFilter && d.popularity <= popularityFilter &&
                d.speechiness <= speechinessFilter && d.valence <= valenceFilter;
        });

        // Bind data to circles
        const circles = svg.selectAll("circle")
            .data(filteredData, d => d.track_id);

        // Remove exiting circles
        circles.exit().remove();

        // Add new circles for new data
        circles.enter().append("circle")
            .attr("cx", d => xScale(d.popularity))
            .attr("cy", d => yScale(d.speechiness))
            .attr("r", 5)
            .attr("fill", "steelblue")
            .on("mouseover", function(event, d) {
                // Highlight on hover
                d3.select(this).attr("fill", "orange");

                // Display tooltip with track details
                tooltip.style("display", "block")
                    .html(`Track: ${d.track_name}<br>Artist: ${d.artist_name}<br>Year: ${d.year}<br>Popularity: ${d.popularity}<br>Speechiness: ${d.speechiness}<br>Valence: ${d.valence}`)
                    .style("left", `${event.pageX + 5}px`)
                    .style("top", `${event.pageY + 5}px`);
            })
            .on("mouseout", function() {
                d3.select(this).attr("fill", "steelblue"); // Reset color
                tooltip.style("display", "none"); // Hide tooltip
            });

        // Update existing circles
        circles.transition()
            .duration(500)
            .attr("cx", d => xScale(d.popularity))
            .attr("cy", d => yScale(d.speechiness));
    }

    // Update visualization after filters
    updateVisualization();

    // Add event listeners to filters
    document.getElementById("yearFilter").addEventListener("change", updateVisualization);
    document.getElementById("popularityFilter").addEventListener("input", function() {
        document.getElementById("popularityValue").textContent = this.value;
        updateVisualization();
    });
    document.getElementById("speechinessFilter").addEventListener("input", function() {
        document.getElementById("speechinessValue").textContent = this.value;
        updateVisualization();
    });
    document.getElementById("valenceFilter").addEventListener("input", function() {
        document.getElementById("valenceValue").textContent = this.value;
        updateVisualization();
    });
});
// Prepare the data for the line chart: average popularity per year


/*
d3.csv("spotify_tracks.csv").then(data => {
    // Parse the data
    data.forEach(d => {
        d.popularity = +d.popularity;
        d.valence = +d.valence;
        d.year = +d.year;
    });

    // SVG and chart dimensions
    const margin = { top: 30, right: 30, bottom: 50, left: 50 };
    const width = 800;
    const height = 400;

    const svg = d3.select("#grouped-bar-chart")
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    // Define color scale
    const color = d3.scaleOrdinal()
        .domain(["Low", "Medium", "High"])
        .range(["#ff6f61", "#ffcc00", "#69b3a2"]);

    // Group data into valence categories
    const valenceCategories = {
        low: d => d.valence < 0.33,
        medium: d => d.valence >= 0.33 && d.valence < 0.66,
        high: d => d.valence >= 0.66,
    };

    function processData(filteredData) {
        return d3.rollups(
            filteredData,
            tracks => d3.mean(tracks, d => d.popularity),
            d => {
                if (valenceCategories.low(d)) return "Low";
                if (valenceCategories.medium(d)) return "Medium";
                return "High";
            }
        ).map(([category, popularity]) => ({ category, popularity }));
    }

    function drawChart(filteredData) {
        // Clear previous chart
        svg.selectAll("*").remove();

        // Process data
        const groupedData = processData(filteredData);

        // Scales
        const x = d3.scaleBand()
            .domain(groupedData.map(d => d.category))
            .range([margin.left, width - margin.right])
            .padding(0.1);

        const y = d3.scaleLinear()
            .domain([0, d3.max(groupedData, d => d.popularity)])
            .nice()
            .range([height - margin.bottom, margin.top]);

        // Axes
        svg.append("g")
            .attr("transform", `translate(0,${height - margin.bottom})`)
            .call(d3.axisBottom(x));

        svg.append("g")
            .attr("transform", `translate(${margin.left},0)`)
            .call(d3.axisLeft(y));

        // Bars
        svg.selectAll("rect")
            .data(groupedData)
            .join("rect")
            .attr("x", d => x(d.category))
            .attr("y", d => y(d.popularity))
            .attr("width", x.bandwidth())
            .attr("height", d => height - margin.bottom - y(d.popularity))
            .attr("fill", d => color(d.category))
            .on("mouseover", (event, d) => {
                d3.select(event.currentTarget).attr("fill", "orange");
                d3.select("#details").html(`
                    <p><strong>Category:</strong> ${d.category}</p>
                    <p><strong>Popularity:</strong> ${d.popularity.toFixed(2)}</p>
                `);
            })
            .on("mouseout", (event, d) => {
                d3.select(event.currentTarget).attr("fill", color(d.category));
                d3.select("#details").html("");
            });
    }

    // Initial
    drawChart(data);

    // Filter dropdown
    d3.select("#popularity-filter").on("change", function () {
        const selectedRange = this.value;

        // Filter data based on selected range
        const filteredData = data.filter(d => {
            if (selectedRange === "all") return true; // All tracks
            if (selectedRange === "low") return d.popularity >= 0 && d.popularity <= 33;
            if (selectedRange === "medium") return d.popularity > 33 && d.popularity <= 66;
            if (selectedRange === "high") return d.popularity > 66 && d.popularity <= 100;
        });

        // Redraw chart
        drawChart(filteredData);
    });
});
*/
    //  Year dropdown
    // const years = Array.from(new Set(data.map(d => d.year))).sort();
    // const yearDropdown = d3.select("#year-filter");
    // years.forEach(year => {
    //    yearDropdown.append("option").text(year).attr("value", year);
    //});

    //createGroupedBarChart(processedData);


/*

    d3.csv("spotify_tracks.csv").then(data => {


    // Parse the data
    data.forEach(d => {
        d.popularity = +d.popularity; //
    });

    // Set up  chart
    const width = 800;
    const height = 400;
    const margin = { top: 20, right: 30, bottom: 40, left: 40 };

    // Create the SVG element
    const svg = d3.select("#bar-chart")
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    // Set up x scale
    const x = d3.scaleBand()
        .domain(data.map(d => d.track_name))
        .range([margin.left, width - margin.right])
        .padding(0.1);

    // Set up y scale
    const y = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.popularity)])
        .nice()
        .range([height - margin.bottom, margin.top]);

    // Add bars
    svg.selectAll(".bar")
        .data(data)
        .enter().append("rect")
        .attr("class", "bar")
        .attr("x", d => x(d.track_name))
        .attr("y", d => y(d.popularity))
        .attr("width", x.bandwidth())
        .attr("height", d => height - margin.bottom - y(d.popularity))
        .style("fill", "#69b3a2");

    // Add the x and y
    svg.append("g")
        .attr("transform", `translate(0, ${height - margin.bottom})`)
        .call(d3.axisBottom(x))
        .selectAll("text")
        .style("font-size", "10px") // Rotate labels if they're too long
        .style("text-anchor", "middle");

    svg.append("g")
        .attr("transform", `translate(${margin.left}, 0)`)
        .call(d3.axisLeft(y));

}).catch(error => console.error("Error loading the CSV file:", error));

d3.select("#filter-button").on("click", () => {
    const threshold = +d3.select("#popularity-filter").property("value");

    // Filter data
    const filteredData = data.filter(d => d.popularity > threshold);

    // Update the x
    x.domain(filteredData.map(d => d.track_name));

    // Update bars
    const bars = svg.selectAll(".bar").data(filteredData, d => d.track_name);
*/