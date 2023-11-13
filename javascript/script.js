document.addEventListener('DOMContentLoaded', function () {
    // Function to fetch CSV data from a file
    async function fetchCsvData() {
        try {
            const response = await fetch('data/Data_simplified.csv'); // Updated file path
            const csvData = await response.text();
            return csvData;
        } catch (error) {
            console.error('Error fetching CSV data:', error);
        }
    }

    // Function to convert CSV to array of objects
    function csvToArray(csv) {
        var rows = csv.trim().split('\n');
        var headers = rows[0].split(',');
        var data = [];

        for (var i = 1; i < rows.length; i++) {
            var obj = {};
            var currentRow = rows[i].split(',');

            for (var j = 0; j < headers.length; j++) {
                obj[headers[j]] = currentRow[j];
            }

            data.push(obj);
        }

        return data;
    }

    // Function to group data by month and province
    function groupDataByMonthAndProvince(data) {
        var groupedData = {};

        data.forEach(function (row) {
            var date = row.date.split('/')[0] + '/' + row.date.split('/')[1]; // Extract month
            var province = row.iso_3166_2_code;

            var key = date + '-' + province;

            if (!groupedData[key]) {
                groupedData[key] = [];
            }

            groupedData[key].push(row);
        });

        return groupedData;
    }

    // Function to calculate ave for a specific column
    function calculateave(dataArray, column) {
        var sum = dataArray.reduce(function (acc, row) {
            return acc + parseFloat(row[column]);
        }, 0);

        return sum / dataArray.length;
    }

    // Fetch CSV data and calculate ave for workplaces_percent_change_from_baseline in all provinces
    fetchCsvData()
        .then(csvData => {
            // Convert CSV to array of objects
            var dataArray = csvToArray(csvData);

            // Group data by month and province
            var groupedData = groupDataByMonthAndProvince(dataArray);

            // Calculate ave for workplaces_percent_change_from_baseline in all provinces
            var ProvAve = {};
            var ProvAve_grocery = {};

            for (var key in groupedData) {
                if (groupedData.hasOwnProperty(key)) {
                    var provinceCode = key.split('-ZA-')[1];

                    if (!ProvAve[provinceCode]) {
                        ProvAve[provinceCode] = {
                            sum: 0,
                            count: 0,
                        };
                    }

                    if (!ProvAve_grocery[provinceCode]) {
                        ProvAve_grocery[provinceCode] = {
                            sum: 0,
                            count: 0,
                        };
                    }

                    ProvAve[provinceCode].sum += calculateave(groupedData[key], 'workplaces_percent_change_from_baseline');
                    ProvAve[provinceCode].count += 1;

                    ProvAve_grocery[provinceCode].sum += calculateave(groupedData[key], 'grocery_and_pharmacy_percent_change_from_baseline');
                    ProvAve_grocery[provinceCode].count += 1;
                }
            }

            // Calculate final ave for each province
            var provinceLabels = [];
            var Prov_average = [];

            for (var provinceCode in ProvAve) {
                if (ProvAve.hasOwnProperty(provinceCode)) {
                    var ave = ProvAve[provinceCode].sum / ProvAve[provinceCode].count;
                    console.log(`Ave Workplaces % Change in ${provinceCode}:`, ave);

                    provinceLabels.push(provinceCode);
                    Prov_average.push(ave);
                }
            }
            // Render bar chart
            // Render line chart for workplaces
            AveProv_chart('chart1', provinceLabels, Prov_average, 'Workplaces Chart', 'Average Workplace Mobility Change');

            // Calculate final ave for each province for groceries
            var provinceLabels_grocery = [];
            var Prov_average_grocery = [];
            for (var provinceCode in ProvAve_grocery) {
                if (ProvAve_grocery.hasOwnProperty(provinceCode)) {
                    var aveGrocery = ProvAve_grocery[provinceCode].sum / ProvAve_grocery[provinceCode].count;
                    console.log(`Ave Grocery % Change in ${provinceCode}:`, aveGrocery);
    
                    provinceLabels_grocery.push(provinceCode);
                    Prov_average_grocery.push(aveGrocery);
                }
            }
            AveProv_chart('chart2', provinceLabels_grocery, Prov_average_grocery, 'Grocery Chart', 'Average Grocery and Pharmacy Mobility Change');

        });
});

function AveProv_chart(canvasId, labels, data, chartLabel, yAxisLabel) {
    var ctx = document.getElementById(canvasId).getContext('2d');
    var myChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: chartLabel,
                data: data,
                backgroundColor: '#03fca9',
                borderColor: '#004d33',
                borderWidth: 2,
                hoverBackgroundColor: '#03fca9',
            }, {
                type: 'line',
                label: 'Average',
                fill: false,
                data: Array(data.length).fill(data.reduce((a, b) => a + b, 0) / data.length),
                borderColor: 'rgba(127, 0, 0, 1)',
                borderWidth: 1,
                borderDash: [5, 5]
            }]
        },
        options: {
            scales: {
                y: {
                    ticks: {
                        beginAtZero: true,
                        callback: function (value, index, values) {
                            return value + ' %';
                        }
                    },
                    title: {
                        display: true,
                        text: yAxisLabel
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Province by short code'
                    }
                }
            }
        }
    });
}

