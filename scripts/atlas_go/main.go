// atlas_go: list Go functions, calls, goroutine launches and receiver field reads/writes as JSON
// for the course-studio project atlas. Called by ../atlas_extract.py; usable alone:
//   go run . -root ~/6.5840/src -board rf. raft kvraft
package main

import (
	"encoding/json"
	"flag"
	"go/ast"
	"go/parser"
	"go/token"
	"io/fs"
	"os"
	"path/filepath"
	"sort"
	"strings"
)

type Func struct {
	Name   string  `json:"name"`
	Recv   string  `json:"recv,omitempty"`
	Start  int     `json:"start"`
	End    int     `json:"end"`
	Calls  [][]any `json:"calls"`            // [line, name] or [line, name, "go"] for a goroutine launch
	Writes [][]any `json:"writes,omitempty"` // [line, "field.path"] on the board prefix (e.g. rf.)
	Reads  [][]any `json:"reads,omitempty"`
	Locks  []int   `json:"locks,omitempty"` // lines calling .Lock()
}
type File struct {
	Path  string `json:"path"`
	Lines int    `json:"lines"`
	Funcs []Func `json:"funcs"`
}

func selPath(e ast.Expr) string {
	switch x := e.(type) {
	case *ast.Ident:
		return x.Name
	case *ast.SelectorExpr:
		p := selPath(x.X)
		if p == "" {
			return ""
		}
		return p + "." + x.Sel.Name
	case *ast.IndexExpr:
		return selPath(x.X)
	}
	return ""
}

func main() {
	root := flag.String("root", ".", "repo root")
	board := flag.String("board", "", "comma-separated prefixes whose fields count as shared state, e.g. rf.,kv.")
	tests := flag.Bool("tests", false, "include _test.go files")
	flag.Parse()
	prefixes := []string{}
	for _, b := range strings.Split(*board, ",") {
		if b != "" {
			prefixes = append(prefixes, b)
		}
	}
	paths := flag.Args()
	if len(paths) == 0 {
		paths = []string{"."}
	}
	fset := token.NewFileSet()
	var files []File
	for _, p := range paths {
		filepath.WalkDir(filepath.Join(*root, p), func(path string, d fs.DirEntry, err error) error {
			if err != nil || d.IsDir() || !strings.HasSuffix(path, ".go") || (!*tests && strings.HasSuffix(path, "_test.go")) {
				return nil
			}
			src, err := os.ReadFile(path)
			if err != nil {
				return nil
			}
			f, err := parser.ParseFile(fset, path, src, 0)
			if err != nil {
				return nil
			}
			rel, _ := filepath.Rel(*root, path)
			out := File{Path: rel, Lines: strings.Count(string(src), "\n") + 1, Funcs: []Func{}}
			for _, decl := range f.Decls {
				fd, ok := decl.(*ast.FuncDecl)
				if !ok || fd.Body == nil {
					continue
				}
				fn := Func{Name: fd.Name.Name, Start: fset.Position(fd.Pos()).Line, End: fset.Position(fd.End()).Line, Calls: [][]any{}}
				if fd.Recv != nil && len(fd.Recv.List) > 0 {
					t := fd.Recv.List[0].Type
					if s, ok := t.(*ast.StarExpr); ok {
						t = s.X
					}
					if id, ok := t.(*ast.Ident); ok {
						fn.Recv = id.Name
					}
				}
				written, callee := map[ast.Expr]bool{}, map[ast.Expr]bool{}
				ast.Inspect(fd.Body, func(n ast.Node) bool {
					switch x := n.(type) {
					case *ast.GoStmt:
						if name := selPath(x.Call.Fun); name != "" {
							parts := strings.Split(name, ".")
							fn.Calls = append(fn.Calls, []any{fset.Position(x.Pos()).Line, parts[len(parts)-1], "go"})
						} else {
							fn.Calls = append(fn.Calls, []any{fset.Position(x.Pos()).Line, "func literal", "go"})
						}
					case *ast.CallExpr:
						callee[x.Fun] = true
						name := selPath(x.Fun)
						if name == "" {
							break
						}
						parts := strings.Split(name, ".")
						last := parts[len(parts)-1]
						if last == "Lock" || last == "RLock" {
							fn.Locks = append(fn.Locks, fset.Position(x.Pos()).Line)
						}
						fn.Calls = append(fn.Calls, []any{fset.Position(x.Pos()).Line, last})
					case *ast.AssignStmt:
						for _, l := range x.Lhs {
							written[l] = true
							if ix, ok := l.(*ast.IndexExpr); ok {
								written[ix.X] = true
							}
						}
					case *ast.IncDecStmt:
						written[x.X] = true
					case *ast.SelectorExpr:
						if callee[x] {
							return false // a method call such as rf.mu.Lock() is not a read of shared state
						}
						p := selPath(x)
						for _, pre := range prefixes {
							if strings.HasPrefix(p+".", pre) && p+"." != pre && strings.Count(p, ".") >= 1 {
								entry := []any{fset.Position(x.Pos()).Line, strings.TrimPrefix(p, pre)}
								if written[x] {
									fn.Writes = append(fn.Writes, entry)
								} else {
									fn.Reads = append(fn.Reads, entry)
								}
								return false // the full path is recorded; skip its inner selectors
							}
						}
					}
					return true
				})
				out.Funcs = append(out.Funcs, fn)
			}
			files = append(files, out)
			return nil
		})
	}
	sort.Slice(files, func(i, j int) bool { return files[i].Path < files[j].Path })
	enc := json.NewEncoder(os.Stdout)
	enc.Encode(files)
}
