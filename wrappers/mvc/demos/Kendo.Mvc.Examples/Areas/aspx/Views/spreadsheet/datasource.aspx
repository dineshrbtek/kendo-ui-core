<%@ Page Title="" Language="C#" MasterPageFile="~/Areas/aspx/Views/Shared/Web.Master" Inherits="System.Web.Mvc.ViewPage<dynamic>" %>

<asp:Content ID="Content1" ContentPlaceHolderID="MainContent" runat="server">

<script src="//cdnjs.cloudflare.com/ajax/libs/jszip/2.4.0/jszip.min.js"></script>
    <script src="<%= Url.Content("~/Scripts/jszip.min.js") %>"></script>

    <div class="box wide">
        <div class="box-col">
        <h4>Save data changes</h4>
        <ul class="options">
            <li>
                <button class="k-button" id="save">Save changes</button>
                <button class="k-button" id="cancel">Cancel changes</button>
            </li>
        </ul>
        </div>
    </div>

    <%:Html.Kendo().Spreadsheet()
        .Name("spreadsheet")
        .HtmlAttributes(new { style = "width:100%" })
        .Excel(excel => excel
            .ProxyURL(Url.Action("Index_Save", "Spreadsheet"))
        )
        .Pdf(pdf => pdf
            .ProxyURL(Url.Action("Index_Save", "Spreadsheet"))
        )
        .Sheets(sheets =>
        {
            sheets.Add()
                .Name("Products")
                .DataSource<Kendo.Mvc.Examples.Models.SpreadsheetProductViewModel>(ds => ds
                    .Ajax()
                    .Batch(true)
                    .Read("Products_Read", "Spreadsheet")
                    .Update("Products_Update", "Spreadsheet")
                    .Create("Products_Create", "Spreadsheet")
                    .Destroy("Products_Destroy", "Spreadsheet")
                    .Events(e => e.Change("onChange"))
                    .Model(m => {
                        m.Id(p => p.ProductID);
                    })
                )
                .Columns(columns =>
                {
                    columns.Add().Width(100);
                    columns.Add().Width(415);
                    columns.Add().Width(145);
                    columns.Add().Width(145);
                    columns.Add().Width(145);
                })
                .Rows(rows =>
                {
                    rows.Add().Height(40).Cells(cells =>
                    {
                        cells.Add()
                            .Bold(true)
                            .Background("#9c27b0")
                            .TextAlign(SpreadsheetTextAlign.Center)
                            .Color("white");
                        
                        cells.Add()
                            .Bold(true)
                            .Background("#9c27b0")
                            .TextAlign(SpreadsheetTextAlign.Center)
                            .Color("white");

                        cells.Add()
                            .Bold(true)
                            .Background("#9c27b0")
                            .TextAlign(SpreadsheetTextAlign.Center)
                            .Color("white");

                        cells.Add()
                            .Bold(true)
                            .Background("#9c27b0")
                            .TextAlign(SpreadsheetTextAlign.Center)
                            .Color("white");

                        cells.Add()
                            .Bold(true)
                            .Background("#9c27b0")
                            .TextAlign(SpreadsheetTextAlign.Center)
                            .Color("white");
                    });
                });
        })
    %>

    <script>
        function onChange(e) {
            $("#cancel, #save").toggleClass("k-state-disabled", !this.hasChanges());
        }

        function getDataSource() {
            return $("#spreadsheet").data("kendoSpreadsheet").activeSheet().dataSource;
        }

        $("#save").click(function() {
            if (!$(this).hasClass("k-state-disabled")) {
                getDataSource().sync();
            }
        });

        $("#cancel").click(function() {
            if (!$(this).hasClass("k-state-disabled")) {
                getDataSource().cancelChanges();
            }
        });
    </script>
</asp:Content>