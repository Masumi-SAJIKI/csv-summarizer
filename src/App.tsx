import { useCallback, useEffect, useState } from "react";
import "./App.css";
import { styled } from "@mui/material/styles";
import Button from "@mui/material/Button";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import Box from "@mui/material/Box";
import {
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  Typography,
  TextField,
} from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";

const VisuallyHiddenInput = styled("input")({
  clip: "rect(0 0 0 0)",
  clipPath: "inset(50%)",
  height: 1,
  overflow: "hidden",
  position: "absolute",
  bottom: 0,
  left: 0,
  whiteSpace: "nowrap",
  width: 1,
});

interface SummarizeColumn {
  total?: string;
  sub?: string;
}

function App() {
  const [csv, setCsv] = useState<string>();
  const [path, setPath] = useState<string>();
  const [result, setResult] = useState<string>("");
  const [input, setInput] = useState<string>("");
  const [rows, setRows] = useState<{ [key: string]: string }[]>([]);
  const [header, setHeader] = useState<GridColDef[]>([]);
  const [columns, setColumns] = useState<SummarizeColumn | undefined>(
    undefined
  );

  const handleChangeSummarize = useCallback(
    (event: SelectChangeEvent<HTMLInputElement>) => {
      setColumns({ ...columns, total: event.target.value.toString() });
    },
    [columns]
  );

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(result).then(
      () => {
        console.log("copied");
      },
      () => {
        console.log("occurred error at copy");
      }
    );
  }, [result]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = event.target.files && event.target.files[0];

      if (file) {
        setPath(file.name);
        const reader = new FileReader();
        reader.onload = (e) => {
          const content = e.target?.result as string;
          setCsv(content);
        };
        reader.readAsText(file);
      }
      console.log("handleFileUploaded");
    } catch (error) {
      console.log("handleFileUpload", error);
    }
  };
  const parseCsvRow = (row: string): string[] => {
    try {
      let insideQuotes = false;
      const values: string[] = [];
      let currentValue = "";

      for (let i = 0; i < row.length; i++) {
        const char = row[i];

        if (char === '"') {
          insideQuotes = !insideQuotes;
        } else if (char === "," && !insideQuotes) {
          values.push(currentValue);
          currentValue = "";
        } else {
          currentValue += char;
        }
      }

      values.push(currentValue);
      console.log("parseCsvRow");
      return values;
    } catch (error) {
      console.log("parseCsvRow", error);
    }
    return [];
  };
  useEffect(() => {
    try {
      if (csv) {
        const lines = csv.split("\n").filter((r) => r);
        const headers = lines[0]
          .split(",")
          .map((h) => h.replace('"', "").replace('"', "").toLowerCase());

        const existId = headers.includes("id");
        const jsonDataArray: { [key: string]: string }[] = [];

        for (let i = 1; i < lines.length; i++) {
          const values = parseCsvRow(lines[i]);
          const entry: { [key: string]: string } = {};

          const forCount = existId ? headers.length : headers.length + 1;

          for (let j = 0; j < forCount; j++) {
            if (j >= headers.length) {
              entry["id"] = i.toString();
            } else {
              entry[headers[j]] = values[j];
            }
          }
          jsonDataArray.push(entry);
        }

        const heads = headers.map((h) => {
          const col = jsonDataArray[0][h].toString().length || 4;
          const calc = col > 25 ? col - 10 : col;
          const calc2 = calc < 5 ? calc + 5 : calc;
          return { field: h, headerName: h, width: calc2 * 12 };
        });
        console.log("useEffect", heads, jsonDataArray);
        setRows(jsonDataArray);
        setHeader(heads);
      }
    } catch (error) {
      console.log("useEffect", error);
    }
  }, [csv]);

  useEffect(() => {
    try {
      if (columns?.total && columns?.sub && input.length > 0) {
        const sumTargets = rows
          .map((r) => Number(r[columns.total || ""]) || 0)
          .reduce((sum, ele) => sum + ele, 0);

        const outTikets = rows.filter((r) =>
          (r[columns.sub || ""] || "").includes(input)
        );
        const sumOutTicketTargets = outTikets
          .map((r) => Number(r[columns.total || ""]) || 0)
          .reduce((sum, ele) => sum + ele, 0);

        setResult(`- ${columns.total}合計:${Math.round(sumTargets * 10) / 10}
-- ${input}:${Math.round(sumOutTicketTargets * 10) / 10}
-- そのた:${
          Math.round(sumTargets * 10) / 10 -
          Math.round(sumOutTicketTargets * 10) / 10
        }`);
      }
    } catch (error) {
      console.log("calc", error);
    }
  }, [columns, input, rows]);

  return (
    <Grid
      container
      spacing={1}
      direction="row"
      justifyContent="flex-start"
      alignItems="flex-start"
      width="90vw"
      mb={2}
    >
      <Grid item xs="auto">
        <Button
          component="label"
          variant="contained"
          startIcon={<CloudUploadIcon />}
        >
          Upload file
          <VisuallyHiddenInput type="file" onChange={handleFileUpload} />
        </Button>
      </Grid>
      <Grid item xs="auto">
        <Typography>{path}</Typography>
      </Grid>
      <Grid item xs={12} sx={{ textAlign: "left" }}>
        <Typography>件数：{rows.length}</Typography>
        <Box sx={{ height: 400 }}>
          <DataGrid
            rows={rows}
            columns={header}
            hideFooter
            disableColumnSelector
            disableRowSelectionOnClick
          />
        </Box>
      </Grid>
      <Grid item xs={12} textAlign="left">
        <FormControl>
          <InputLabel id="demo-simple-select-label">集計項目</InputLabel>
          <Select
            labelId="demo-simple-select-label"
            id="demo-simple-select"
            value={columns?.total || ""}
            label="集計項目"
            onChange={handleChangeSummarize}
            sx={{ minWidth: 120 }}
            disabled={header.length === 0}
          >
            {header.map((h, index) => (
              <MenuItem value={h.field} key={h.field || index}>
                {h.field}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl>
          <InputLabel id="demo-simple-select-label">サブ集計項目</InputLabel>
          <Select
            labelId="demo-simple-select-label"
            id="demo-simple-select"
            value={columns?.sub || ""}
            label="集計項目"
            onChange={(e) =>
              setColumns({ ...columns, sub: e.target.value.toString() })
            }
            sx={{ minWidth: 120 }}
            disabled={header.length === 0}
          >
            {header.map((h, index) => (
              <MenuItem value={h.field} key={h.field || index}>
                {h.field}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <TextField value={input} onChange={(e) => setInput(e.target.value)} />
      </Grid>
      <Grid item xs={12}>
        <IconButton onClick={handleCopy}>
          <ContentCopyIcon />
        </IconButton>
        <TextField fullWidth multiline rows={3} value={result} />
      </Grid>
    </Grid>
  );
}

export default App;
