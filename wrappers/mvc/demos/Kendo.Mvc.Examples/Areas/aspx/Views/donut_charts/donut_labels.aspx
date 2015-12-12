﻿<%@ Page Title="" Language="C#" MasterPageFile="~/Areas/aspx/Views/Shared/Web.Master" Inherits="System.Web.Mvc.ViewPage<dynamic>" %>

<asp:Content ContentPlaceHolderID="MainContent" runat="server">
<div class="demo-section k-content wide">
<%= Html.Kendo().Chart()
    .Name("chart")
    .Title("What is you favourite sport?")
    .Legend(legend => legend
        .Position(ChartLegendPosition.Top)
    )
    .Series(series =>
    {
        series.Donut(new dynamic[] {
    new {category = "Football",value = 35},
    new {category = "Basketball",value = 25},
    new {category = "Volleyball",value = 20},
    new {category = "Rugby",value = 10},
    new {category = "Tennis",value = 10}                
})
        .Labels(labels => labels
            .Visible(true)
            .Position(ChartPieLabelsPosition.OutsideEnd)
            .Template("#= category # - #= kendo.format('{0:P}', percentage)#")
            .Background("transparent")
        );
    })
    .Tooltip(tooltip => tooltip
        .Visible(true)
        .Template("#= category # - #= kendo.format('{0:P}', percentage) #")
    )
%>
</div>
<div class="box wide">
    <div class="box-col">
        <h4>Labels Configuration</h4>
        <ul class="options">
            <li>
                <input id="labels" checked="checked" type="checkbox" autocomplete="off" />
                <label for="labels">Show labels</label>
            </li>
            <li>
                <input id="alignCircle" name="alignType" type="radio"
                       value="circle" checked="checked" autocomplete="off" />
                <label for="alignCircle">Aligned in circle</label>
            </li>
            <li>
                <input id="alignColumn" name="alignType" type="radio"
                       value="column" autocomplete="off" />
                <label for="alignColumn">Aligned in columns</label>
            </li>
        </ul>
    </div>
</div>
<script>
    $(document).ready(function() {
        $(".box").bind("change", refresh);
    });

    function refresh() {
        var chart = $("#chart").data("kendoChart"),
            pieSeries = chart.options.series[0],
            labels = $("#labels").prop("checked"),
            alignInputs = $("input[name='alignType']"),
            alignLabels = alignInputs.filter(":checked").val();

        chart.options.transitions = false;
        pieSeries.labels.visible = labels;
        pieSeries.labels.align = alignLabels;

        alignInputs.attr("disabled", !labels);

        chart.refresh();
    }
</script>
</asp:Content>
