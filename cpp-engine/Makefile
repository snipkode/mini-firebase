CXX = g++
CXXFLAGS = -std=c++11 -fPIC -shared -O2
LDFLAGS = -pthread

all: libdatabase.so db-cli

libdatabase.so: database.h
	$(CXX) $(CXXFLAGS) -o libdatabase.so database.h -L. $(LDFLAGS)

db-cli: main.cpp database.h
	$(CXX) -std=c++11 -O2 -o db-cli main.cpp -pthread

clean:
	rm -f libdatabase.so db-cli

install: libdatabase.so
	cp libdatabase.so ../api/

.PHONY: all clean install
